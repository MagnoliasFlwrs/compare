import React, { type CSSProperties } from 'react';
import {
    ENTITY_ATTRIBUTES_TABLE_HEIGHT,
    ENTITY_ATTRIBUTES_TABLE_SCROLL_Y,
} from './entityAttributesTableLayout';
import './entityAttributesTables.css';

interface Props {
    children: React.ReactNode;
}

const EntityAttributesTableWrap: React.FC<Props> = ({ children }) => {
    const style: CSSProperties = {
        height: ENTITY_ATTRIBUTES_TABLE_HEIGHT,
        minHeight: ENTITY_ATTRIBUTES_TABLE_HEIGHT,
        ['--entity-attributes-table-scroll-y' as string]: `${ENTITY_ATTRIBUTES_TABLE_SCROLL_Y}px`,
    };

    return (
        <div className="entity-attributes-table-wrap" style={style}>
            {children}
        </div>
    );
};

export { ENTITY_ATTRIBUTES_TABLE_SCROLL_Y };
export default EntityAttributesTableWrap;
