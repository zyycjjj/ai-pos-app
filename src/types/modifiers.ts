export type ProductModifierOption = {
  id: string;
  name: string;
  priceDelta: number;
  status?: 'ACTIVE' | 'INACTIVE' | 'SOLD_OUT';
  displayOrder: number;
};

export type ProductModifierGroup = {
  id: string;
  name: string;
  required: boolean;
  multiSelect: boolean;
  minSelect?: number;
  maxSelect?: number;
  status?: 'ACTIVE' | 'INACTIVE';
  displayOrder: number;
  options: ProductModifierOption[];
};

export type SelectedModifier = {
  groupId: string;
  groupName: string;
  optionId: string;
  optionName: string;
  priceDelta: number;
};
