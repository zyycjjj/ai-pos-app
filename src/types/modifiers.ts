export type ProductModifierOption = {
  id: string;
  name: string;
  priceDelta: number;
  displayOrder: number;
};

export type ProductModifierGroup = {
  id: string;
  name: string;
  required: boolean;
  multiSelect: boolean;
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
