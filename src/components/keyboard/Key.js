import { memo } from 'react';

const Key = ({
    item,
    click_key,
    index,
    isActive,
    onMouseEnter,
    rowIndex
}) => {

    return (
        <div
            onMouseEnter={() => onMouseEnter(index, rowIndex)}
            onClick={(() => click_key(item))}
            className={`letter_keyboard ${(item.key.length > 1 ? item.key + ' large' : '')}${isActive ? ' active' : ''}`}
        >
            {item.key.length === 1 ? <p>{item.key}</p> : null}
        </div>
    )

}

export default memo(Key);