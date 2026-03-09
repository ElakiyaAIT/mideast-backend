import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsNumber,
  IsOptional,
  IsMongoId,
  IsArray,
  IsObject,
  Min,
  Max,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ListingType } from '../enums';
import {
  BasicDetailsDto,
  GeneralDto,
  ConditionDto,
  EngineConditionDto,
  HydraulicsDto,
  CabElectronicsDto,
  EngineDto,
  ExteriorDto,
  FunctionalTestDto,
  HydraulicsChecklistDto,
  UnderCarriageDto,
  MediaDto,
  EquipmentIdentityDto,
  OwnershipDto,
} from './seller-equipment-form.dto';

class LocationDto {
  @IsOptional()
  @IsMongoId()
  _id?: string;

  @IsString()
  @IsNotEmpty()
  address: string;

  @IsString()
  @IsNotEmpty()
  city: string;

  @IsString()
  @IsNotEmpty()
  state: string;

  @IsString()
  @IsNotEmpty()
  zipCode: string;

  @IsString()
  @IsNotEmpty()
  country: string;

  @IsObject()
  @IsOptional()
  coordinates?: {
    lat: number;
    lng: number;
  };
}

export class CheckListDto {
  @ValidateNested()
  @Type(() => ExteriorDto)
  @IsOptional()
  exterior?: ExteriorDto;

  @ValidateNested()
  @Type(() => EngineDto)
  @IsOptional()
  engine?: EngineDto;

  @ValidateNested()
  @Type(() => HydraulicsChecklistDto)
  @IsOptional()
  hydraulics?: HydraulicsChecklistDto;

  @ValidateNested()
  @Type(() => UnderCarriageDto)
  @IsOptional()
  underCarriage?: UnderCarriageDto;

  @ValidateNested()
  @Type(() => FunctionalTestDto)
  @IsOptional()
  functionalTest?: FunctionalTestDto;
}
export class AdditionalInformationDto {
  @ValidateNested()
  @Type(() => EquipmentIdentityDto)
  @IsOptional()
  equipmentIdentity?: EquipmentIdentityDto;

  @ValidateNested()
  @Type(() => LocationDto)
  @IsOptional()
  location?: LocationDto;

  @ValidateNested()
  @Type(() => OwnershipDto)
  @IsOptional()
  ownership?: OwnershipDto;
}

export class CreateEquipmentDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsMongoId()
  @IsNotEmpty()
  categoryId: string;

  @IsMongoId()
  @IsNotEmpty()
  sellerId: string;

  @IsEnum(ListingType)
  @IsNotEmpty()
  listingType: ListingType;

  @IsNumber()
  @IsOptional()
  @Min(0)
  buyNowPrice?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  reservePrice?: number;

  @IsString()
  @IsNotEmpty()
  make: string;

  @IsString()
  @IsNotEmpty()
  models: string;

  @IsNumber()
  @IsNotEmpty()
  @Min(1900)
  @Max(new Date().getFullYear() + 1)
  year: number;

  @IsString()
  @IsOptional()
  serialNumber?: string;

  @IsNumber()
  @IsOptional()
  @Min(0)
  hoursUsed?: number;

  @IsString()
  @IsOptional()
  condition?: string;

  @IsObject()
  @IsOptional()
  attributes?: Record<string, string>;

  @ValidateNested()
  @Type(() => LocationDto)
  @IsNotEmpty()
  location: LocationDto;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  images?: string[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  videos?: string[];

  @IsArray()
  @IsOptional()
  documents?: { name: string; url: string }[];

  @ValidateNested()
  @Type(() => BasicDetailsDto)
  @IsOptional()
  basicDetails?: BasicDetailsDto;

  @ValidateNested()
  @Type(() => GeneralDto)
  @IsOptional()
  general?: GeneralDto;

  @ValidateNested()
  @Type(() => ConditionDto)
  @IsOptional()
  conditionOverview?: ConditionDto;

  @ValidateNested()
  @Type(() => EngineConditionDto)
  @IsOptional()
  engineCondition?: EngineConditionDto;

  @ValidateNested()
  @Type(() => HydraulicsDto)
  @IsOptional()
  hydraulics?: HydraulicsDto;

  @ValidateNested()
  @Type(() => CabElectronicsDto)
  @IsOptional()
  cabElectronics?: CabElectronicsDto;

  @ValidateNested()
  @Type(() => CheckListDto)
  @IsOptional()
  checkList?: CheckListDto;

  @ValidateNested()
  @Type(() => MediaDto)
  @IsOptional()
  media?: MediaDto;

  @ValidateNested()
  @Type(() => AdditionalInformationDto)
  @IsOptional()
  additionalInformation?: AdditionalInformationDto;
}
