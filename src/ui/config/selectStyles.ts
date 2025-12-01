export const defaultSelectStyles = (width = '100%') => ({
    //@ts-ignore
    control: (base, state) => ({
        ...base,
        borderRadius: '6px',
        padding: 0,
        fontSize: '13px',
        boxShadow: state.isFocused ? '0px 0px 0px 4px #ccefff' : 'none',
        borderColor: state.isFocused ? '#CBD5E1' : '#d9d9d9',
        '&:hover': { borderColor: '#CBD5E1' },
        width: width
    }),
    indicatorSeparator: () => ({ display: 'none' }),
    //@ts-ignore
    valueContainer: (base) => ({ ...base, padding: '6px 12px' }),
    //@ts-ignore
    singleValue: (base) => ({ ...base, fontSize: '13px', color: '#64748B' }),
    //@ts-ignore
    placeholder: (base) => ({ ...base, fontSize: '13px', color: '#94A3B8' }),
    //@ts-ignore
    menu: (base) => ({
        ...base,
        border: '1px solid #CBD5E1',
        borderRadius: '6px',
        overflow: 'hidden',
        boxShadow: '0px 4px 16px 0px #00233329, 0px 4px 12px 0px #00233326'
    }),
    //@ts-ignore
    menuList: (base) => ({ ...base, padding: 0 }),
    //@ts-ignore
    option: (base, state) => ({
        ...base,
        fontSize: '14px',
        padding: '4px 12px',
        backgroundColor: state.isSelected ? '#e6f0f5' : '#fff',
        color: '#475569',
        cursor: 'pointer',
        transition: 'background 0.15s ease',
        '&:hover': { backgroundColor: '#f0f7fa' }
    })
}); // <— точка с запятой правильна здесь
