import { Spinner } from './Spinner';

interface InlinePrimaryButtonProps {
    children: React.ReactNode;
    onClick?: () => void;
    loading?: boolean;
    type?: 'button' | 'submit';
    style?: React.CSSProperties;
}

export function InlinePrimaryButton({ children, onClick, loading, type = 'button', style: extraStyle }: InlinePrimaryButtonProps) {
    return (
        <button
            type={type}
            onClick={onClick}
            disabled={loading}
            style={{
                background: loading ? '#2D6A4F' : '#1A3D2B',
                color: '#fff', border: 'none', borderRadius: 6,
                padding: '10px 20px', fontSize: 13, fontWeight: 600,
                cursor: loading ? 'not-allowed' : 'pointer',
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                transition: 'background 0.15s',
                fontFamily: 'Inter, sans-serif',
                ...extraStyle,
            }}
            onMouseEnter={e => { if (!loading) e.currentTarget.style.background = '#2D6A4F'; }}
            onMouseLeave={e => { if (!loading) e.currentTarget.style.background = '#1A3D2B'; }}
        >
            {loading && <Spinner color="#fff" size="sm" />}
            {children}
        </button>
    );
}