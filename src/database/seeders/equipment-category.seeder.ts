import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { EquipmentCategory } from '../../modules/equipment/schemas/equipment-category.schema';

@Injectable()
export class EquipmentCategorySeeder {
  constructor(
    @InjectModel(EquipmentCategory.name)
    private categoryModel: Model<EquipmentCategory>,
  ) {}

  async seed(): Promise<void> {
    console.log('Seeding equipment categories...');

    const categories = [
      {
        name: 'Excavators',
        slug: 'excavators',
        description: 'Heavy-duty excavation equipment for construction and mining',
        attributeTemplate: {
          operatingWeight: {
            label: 'Operating Weight',
            type: 'number',
            unit: 'lbs',
            required: true,
          },
          enginePower: {
            label: 'Engine Power',
            type: 'number',
            unit: 'hp',
            required: true,
          },
          bucketCapacity: {
            label: 'Bucket Capacity',
            type: 'number',
            unit: 'cu yd',
            required: false,
          },
          diggingDepth: {
            label: 'Digging Depth',
            type: 'number',
            unit: 'ft',
            required: false,
          },
        },
        isActive: true,
        sortOrder: 1,
      },
      {
        name: 'Bulldozers',
        slug: 'bulldozers',
        description: 'Powerful track-type tractors for earthmoving',
        attributeTemplate: {
          operatingWeight: {
            label: 'Operating Weight',
            type: 'number',
            unit: 'lbs',
            required: true,
          },
          enginePower: {
            label: 'Engine Power',
            type: 'number',
            unit: 'hp',
            required: true,
          },
          bladeCapacity: {
            label: 'Blade Capacity',
            type: 'number',
            unit: 'cu yd',
            required: false,
          },
        },
        isActive: true,
        sortOrder: 2,
      },
      {
        name: 'Wheel Loaders',
        slug: 'wheel-loaders',
        description: 'Front-loading equipment for material handling',
        attributeTemplate: {
          operatingWeight: {
            label: 'Operating Weight',
            type: 'number',
            unit: 'lbs',
            required: true,
          },
          enginePower: {
            label: 'Engine Power',
            type: 'number',
            unit: 'hp',
            required: true,
          },
          bucketCapacity: {
            label: 'Bucket Capacity',
            type: 'number',
            unit: 'cu yd',
            required: true,
          },
        },
        isActive: true,
        sortOrder: 3,
      },
      {
        name: 'Dump Trucks',
        slug: 'dump-trucks',
        description: 'Heavy-duty trucks for hauling materials',
        attributeTemplate: {
          payloadCapacity: {
            label: 'Payload Capacity',
            type: 'number',
            unit: 'tons',
            required: true,
          },
          enginePower: {
            label: 'Engine Power',
            type: 'number',
            unit: 'hp',
            required: true,
          },
          transmissionType: {
            label: 'Transmission Type',
            type: 'dropdown',
            options: ['Manual', 'Automatic', 'Semi-Automatic'],
            required: true,
          },
        },
        isActive: true,
        sortOrder: 4,
      },
      {
        name: 'Cranes',
        slug: 'cranes',
        description: 'Lifting equipment for construction and industrial use',
        attributeTemplate: {
          maxCapacity: {
            label: 'Maximum Capacity',
            type: 'number',
            unit: 'tons',
            required: true,
          },
          boomLength: {
            label: 'Boom Length',
            type: 'number',
            unit: 'ft',
            required: true,
          },
          craneType: {
            label: 'Crane Type',
            type: 'dropdown',
            options: ['Mobile', 'Tower', 'Crawler', 'Rough Terrain'],
            required: true,
          },
        },
        isActive: true,
        sortOrder: 5,
      },
      {
        name: 'Compactors',
        slug: 'compactors',
        description: 'Equipment for soil and asphalt compaction',
        attributeTemplate: {
          operatingWeight: {
            label: 'Operating Weight',
            type: 'number',
            unit: 'lbs',
            required: true,
          },
          drumWidth: {
            label: 'Drum Width',
            type: 'number',
            unit: 'in',
            required: true,
          },
          compactorType: {
            label: 'Compactor Type',
            type: 'dropdown',
            options: ['Vibratory', 'Static', 'Pneumatic'],
            required: true,
          },
        },
        isActive: true,
        sortOrder: 6,
      },
    ];

    for (const categoryData of categories) {
      const exists = await this.categoryModel.findOne({
        slug: categoryData.slug,
      });

      if (!exists) {
        const category = new this.categoryModel(categoryData);
        await category.save();
        console.log(`✓ Created category: ${categoryData.name}`);
      } else {
        console.log(`- Category already exists: ${categoryData.name}`);
      }
    }

    console.log('Equipment category seeding completed!');
  }
}
