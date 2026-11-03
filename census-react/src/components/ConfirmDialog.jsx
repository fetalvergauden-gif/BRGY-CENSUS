import React from 'react';

export default function ConfirmDialog({
    open,
    title = 'Please confirm',
    message = 'Are you sure you want to continue?',
    details = '',
    confirmLabel = 'Confirm',
    cancelLabel = 'Cancel',
    tone = 'primary',
    loading = false,
    onConfirm,
    onCancel
}) {
    if (!open) return null;

    const danger = tone === 'danger';

    return (
        <div className="census-confirm-backdrop" role="presentation" onMouseDown={(event) => {
            if (event.target === event.currentTarget && !loading) onCancel?.();
        }}>
            <section className="census-confirm-dialog" role="alertdialog" aria-modal="true" aria-labelledby="census-confirm-title">
                <div className={`census-confirm-icon ${danger ? 'is-danger' : 'is-primary'}`}>
                    <i className={`bi ${danger ? 'bi-exclamation-triangle' : 'bi-check2-circle'}`} />
                </div>
                <h5 id="census-confirm-title">{title}</h5>
                <p className="census-confirm-message">{message}</p>
                {details && <div className="census-confirm-details">{details}</div>}
                <div className="census-confirm-actions">
                    <button type="button" className="btn census-confirm-cancel" onClick={onCancel} disabled={loading}>{cancelLabel}</button>
                    <button type="button" className={`btn ${danger ? 'census-confirm-danger' : 'census-confirm-primary'}`} onClick={onConfirm} disabled={loading}>
                        {loading ? <><span className="spinner-border spinner-border-sm me-2" />Please wait...</> : confirmLabel}
                    </button>
                </div>
            </section>
        </div>
    );
}
