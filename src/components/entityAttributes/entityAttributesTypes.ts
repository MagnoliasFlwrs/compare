import type { Attribute } from '../../types/attributes';
import type { EntityAttributeValue } from '../../types/entityAttributeValue';

export type AvailableAttributeRow = {
    key: string;
    attribute: Attribute;
};

export type AssignedAttributeRow =
    | {
          key: string;
          kind: 'pending';
          attribute: Attribute;
      }
    | {
          key: string;
          kind: 'assigned';
          attribute: Attribute;
          value: EntityAttributeValue;
      };
