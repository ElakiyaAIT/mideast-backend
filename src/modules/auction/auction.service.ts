import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, SortOrder, Types } from 'mongoose';
import { Auction } from './schemas/auction.schema';
import { Bid } from './schemas/bid.schema';
import { CreateAuctionDto, UpdateAuctionDto, AssignEquipmentDto, FilterAuctionDto } from './dto';
import { AuctionStatus } from './enums';
import { Equipment } from '../equipment/schemas/equipment.schema';
import { PaginationResultDto } from '@/common/dto/pagination.dto';
import { FilterAuctionExtendedDto } from './dto/filter-auction-extended.dto';

@Injectable()
export class AuctionService {
  constructor(
    @InjectModel(Auction.name)
    private auctionModel: Model<Auction>,
    @InjectModel(Bid.name)
    private bidModel: Model<Bid>,
    @InjectModel(Equipment.name)
    private equipmentModel: Model<Equipment>,
  ) {}

  async create(createDto: CreateAuctionDto, createdBy: string): Promise<Auction> {
    // Validate dates
    if (new Date(createDto.startDate) >= new Date(createDto.endDate)) {
      throw new BadRequestException('End date must be after start date');
    }

    const auction = new this.auctionModel({
      ...createDto,
      createdBy: new Types.ObjectId(createdBy),
      status: AuctionStatus.SCHEDULED,
    });

    return auction.save();
  }

  async findAll(filters: FilterAuctionDto): Promise<PaginationResultDto<Auction>> {
    const { page = 1, limit = 20, status, sortBy = 'startDate', order = 'asc' } = filters;

    const skip = (page - 1) * limit;
    const query: Record<string, unknown> = { isDeleted: false };

    if (status) {
      query.status = status;
    }

    const sortOrder = order === 'desc' ? -1 : 1;
    const sortObj: Record<string, 1 | -1> = { [sortBy]: sortOrder };

    const [items, total] = await Promise.all([
      this.auctionModel
        .find(query)
        .sort(sortObj)
        .skip(skip)
        .limit(limit)
        .populate('createdBy', 'firstName lastName')
        .exec(),
      this.auctionModel.countDocuments(query),
    ]);

    return new PaginationResultDto<Auction>(items, total, page, limit);
  }

  async findOne(id: string): Promise<Auction> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException('Invalid auction ID');
    }

    const auction = await this.auctionModel
      .findOne({ _id: id, isDeleted: false })
      .populate('createdBy', 'firstName lastName')
      .exec();

    if (!auction) {
      throw new NotFoundException('Auction not found');
    }

    return auction;
  }

  async update(id: string, updateDto: UpdateAuctionDto, updatedBy: string): Promise<Auction> {
    const auction = await this.findOne(id);

    // Validate dates if being updated
    if (updateDto.startDate || updateDto.endDate) {
      const newStartDate = updateDto.startDate || auction.startDate;
      const newEndDate = updateDto.endDate || auction.endDate;

      if (new Date(newStartDate) >= new Date(newEndDate)) {
        throw new BadRequestException('End date must be after start date');
      }
    }

    Object.assign(auction, updateDto);
    auction.updatedBy = new Types.ObjectId(updatedBy);

    return auction.save();
  }

  async assignEquipment(
    auctionId: string,
    assignDto: AssignEquipmentDto,
  ): Promise<{ totalLots: number }> {
    const auction = await this.findOne(auctionId);

    // Update equipment with auction ID
    await this.equipmentModel.updateMany(
      { _id: { $in: assignDto.equipmentIds }, isDeleted: false },
      { $set: { auctionId: new Types.ObjectId(auctionId) } },
    );

    // Update auction total lots
    const totalLots = await this.equipmentModel.countDocuments({
      auctionId: new Types.ObjectId(auctionId),
      isDeleted: false,
    });

    auction.totalLots = totalLots;
    await auction.save();

    return { totalLots };
  }

  async getEquipment(auctionId: string): Promise<Equipment[]> {
    if (!Types.ObjectId.isValid(auctionId)) {
      throw new NotFoundException('Invalid auction ID');
    }

    return this.equipmentModel
      .find({
        auctionId: new Types.ObjectId(auctionId),
        isDeleted: false,
      })
      .populate('categoryId', 'name')
      .populate('sellerId', 'firstName lastName')
      .exec();
  }

  async remove(id: string): Promise<Auction> {
    const auction = await this.findOne(id);

    auction.isDeleted = true;
    auction.deletedAt = new Date();

    return auction.save();
  }

  async cancelAuction(id: string, updatedBy: string): Promise<Auction> {
    const auction = await this.findOne(id);

    if (auction.status === AuctionStatus.COMPLETED) {
      throw new BadRequestException('Cannot cancel a completed auction');
    }

    auction.status = AuctionStatus.CANCELLED;
    auction.updatedBy = new Types.ObjectId(updatedBy);

    return auction.save();
  }

  // Bid tracking methods
  async trackBid(bidData: {
    equipmentId: string;
    auctionId: string;
    bidAmount: number;
    bidderName?: string;
    bidderExternalId?: string;
    externalBidId?: string;
    source?: string;
  }): Promise<Bid> {
    const bid = new this.bidModel({
      ...bidData,
      bidTime: new Date(),
    });

    return bid.save();
  }

  async getBids(auctionId: string): Promise<Bid[]> {
    if (!Types.ObjectId.isValid(auctionId)) {
      throw new NotFoundException('Invalid auction ID');
    }

    return this.bidModel
      .find({ auctionId: new Types.ObjectId(auctionId) })
      .populate('equipmentId', 'title make model')
      .sort({ bidTime: -1 })
      .exec();
  }

  async markWinningBid(bidId: string): Promise<Bid> {
    const bid = await this.bidModel.findById(bidId);

    if (!bid) {
      throw new NotFoundException('Bid not found');
    }

    // Unmark previous winning bid for this equipment
    await this.bidModel.updateMany(
      {
        equipmentId: bid.equipmentId,
        auctionId: bid.auctionId,
        _id: { $ne: bidId },
      },
      { isWinningBid: false },
    );

    bid.isWinningBid = true;
    return bid.save();
  }

  // GET LATEST AUCTION
async findLatest(): Promise<Auction | null> {
  try {
    const auction = await this.auctionModel
      .findOne({ isDeleted: false })
      .sort({ createdAt: -1 })
      .populate('createdBy', 'firstName lastName')
      .exec();

    console.log('🧾 Latest auction:', auction);

    return auction; 
  } catch (error) {
    console.error(' Error fetching latest auction:', error);
    throw error;
  }
}

//GET AUCTION BY TYPE(UPCOMING<PAST)
async findWithFilters(
  filters: FilterAuctionExtendedDto,
): Promise<PaginationResultDto<Auction>> {
  const {
    page = 1,
    limit = 20,
    type,
    startDate,
    location,
    auctionName,
  } = filters;

  const skip = (page - 1) * limit;
  const now = new Date();

  const query: Record<string, any> = {
    isDeleted: false,
  };

  // Upcoming / Past logic
  if (type === 'upcoming') {
    query.startDate = { $gt: now };
  }

  if (type === 'past') {
    query.startDate = { $lt: now };
  }

  // Optional startDate override / filter
  if (startDate) {
    query.startDate = {
      ...(query.startDate || {}),
      $gte: new Date(startDate),
    };
  }

  // Optional location filter
if (location) {
  query.$or = [
    { 'location.address': { $regex: location, $options: 'i' } },
    { 'location.city': { $regex: location, $options: 'i' } },
    { 'location.state': { $regex: location, $options: 'i' } },
    { 'location.zipCode': { $regex: location, $options: 'i' } },
  ];
}

  // Optional auction name filter
  if (auctionName) {
    query.title = { $regex: auctionName, $options: 'i' };
  }

 const sort: Record<string, SortOrder> =
  type === 'past'
    ? { startDate: -1 }
    : { startDate: 1 };
    
  const [items, total] = await Promise.all([
    this.auctionModel
      .find(query)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .populate('createdBy', 'firstName lastName')
      .exec(),
    this.auctionModel.countDocuments(query),
  ]);

  return new PaginationResultDto<Auction>(items, total, page, limit);
}

}
