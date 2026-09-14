import { ChangeEvent } from 'react';
import { StepHeading } from '@/components/ui/StepHeading';
import { InlinePrimaryButton } from '@/components/ui/InlinePrimaryButton';
import { InlineError } from '@/components/ui/InlineError';
import { CreateOrganisationDto } from '@/lib/api/types';

interface CreateOrganisationStepProps {
    org: CreateOrganisationDto;
    error: string;
    saving: boolean;
    onOrgField: (k: keyof CreateOrganisationDto) => (e: ChangeEvent<HTMLInputElement>) => void;
    onSubmit: (e: React.FormEvent) => void;
    onBack: () => void;
}

function FormField({ label, value, onChange, placeholder, hint, required, autoFocus }: {
    label: string; value: string; onChange: (e: ChangeEvent<HTMLInputElement>) => void;
    placeholder?: string; hint?: string; required?: boolean; autoFocus?: boolean;
}) {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#6B6860' }}>
                {label}{required && <span style={{ color: '#B91C1C', marginLeft: 2 }}>*</span>}
            </label>
            <input
                type="text"
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                required={required}
                autoFocus={autoFocus}
                style={{
                    padding: '9px 12px', fontSize: 13, borderRadius: 6,
                    border: '1px solid #C8D9CC', background: '#fff',
                    color: '#0D0D0D', width: '100%',
                    transition: 'border-color 0.15s, box-shadow 0.15s',
                }}
                onFocus={e => { e.currentTarget.style.borderColor = '#2D6A4F'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(45,106,79,0.1)'; }}
                onBlur={e => { e.currentTarget.style.borderColor = '#C8D9CC'; e.currentTarget.style.boxShadow = 'none'; }}
            />
            {hint && <p style={{ fontSize: 11, color: '#9A9890' }}>{hint}</p>}
        </div>
    );
}

export function CreateOrganisationStep({ org, error, saving, onOrgField, onSubmit, onBack }: CreateOrganisationStepProps) {
    return (
        <div>
            <StepHeading
                eyebrow="Step 2 of 3"
                title="Organisation details"
                subtitle="These details appear on every payslip you issue. You can update them any time."
            />
            <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <FormField
                    label="Company name"
                    required
                    value={org.companyName}
                    onChange={onOrgField('companyName')}
                    placeholder="Prestige Clothing (Pty) Ltd"
                    autoFocus
                />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <FormField
                        label="Registration number"
                        value={org.regNumber ?? ''}
                        onChange={onOrgField('regNumber')}
                        placeholder="2019/123456/07"
                        hint="Optional — shown on payslips"
                    />
                    <FormField
                        label="VAT number"
                        value={org.vatNumber ?? ''}
                        onChange={onOrgField('vatNumber')}
                        placeholder="4123456789"
                        hint="Optional"
                    />
                </div>
                <FormField
                    label="Phone number"
                    value={org.phone ?? ''}
                    onChange={onOrgField('phone')}
                    placeholder="011 555 1234"
                />
                <FormField
                    label="Business address"
                    value={org.address ?? ''}
                    onChange={onOrgField('address')}
                    placeholder="14 Industry Road, Germiston, 1401"
                    hint="Shown on payslips"
                />
                {error && <InlineError>{error}</InlineError>}
                <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
                    <button
                        type="button"
                        onClick={onBack}
                        style={{
                            background: 'transparent', color: '#6B6860',
                            border: '1px solid #C8D9CC', borderRadius: 6,
                            padding: '9px 18px', fontSize: 13, fontWeight: 500,
                            cursor: 'pointer',
                        }}
                    >
                        Back
                    </button>
                    <InlinePrimaryButton type="submit" loading={saving} style={{ flex: 1 }}>
                        Save and continue
                    </InlinePrimaryButton>
                </div>
            </form>
        </div>
    );
}