// reports/types/order-populated.type.ts

interface EquipmentCategory {
  name: string;
}

interface Equipment {
  categoryId?: EquipmentCategory;
}

export interface OrderPopulated {
  salePrice: number;
  equipmentId?: Equipment;
}
