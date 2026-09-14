export function InlineError({ children }: { children: React.ReactNode }) {
    return (
        <div style={{
            background: '#FEF2F2', border: '1px solid #FECACA',
            borderRadius: 6, padding: '10px 14px',
            fontSize: 13, color: '#B91C1C', lineHeight: 1.5,
        }}>
            {children}
        </div>
    );
}