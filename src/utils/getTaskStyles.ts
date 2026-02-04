export interface TaskStyle {
    type: "Start" | "Finish" | string;
    icon: string;
}

export const getTaskStyles = (type: string) => {
    const style = styles.find((s) => s.type === type);
    return style || styles[0];
}

const styles: TaskStyle[] = [
    {
        type: "UnknownTask",
        icon: 'fa-regular fa-circle-exclamation',
    },
    {
        type: "Start",
        icon: 'fa-regular fa-play',
    },
    {
        type: "Finish",
        icon: 'fa-regular fa-flag-checkered',
    },
    {
        type: "EmailTask",
        icon: 'fa-regular fa-envelope',
    },
    {
        type: 'SmsTask',
        icon: 'fa-regular fa-message-lines',
    },
    {
        type: 'WhatsappTask',
        icon: 'fa-brands fa-whatsapp',
    },
    {
        type: "CallbackTask",
        icon: 'fa-regular fa-phone-office',
    },
    {
        type: 'SignDocumentsTask',
        icon: 'fa-regular fa-file-certificate',
    },
    {
        type: 'ApprovalTask',
        icon: 'fa-regular fa-check-circle',
    },
    {
        type: "DocumentReadTask",
        icon: 'fa-regular fa-book-open',
    },
    {
        type: "HelpPanelTask",
        icon: 'fa-regular fa-circle-question',
    },
    {
        type: "PhotoTask",
        icon: 'fa-regular fa-camera',
    },
    {
        type: "SignatureTask",
        icon: 'fa-regular fa-signature',
    },
    {
        type: "DniFrontTask",
        icon: 'fa-regular fa-address-card',
    },
    {
        type: "DniBackTask",
        icon: 'fa-regular fa-credit-card-blank',
    },
    {
        type: "LiveTask",
        icon: 'fa-regular fa-face-viewfinder',
    },
    {
        type: "FaceCompareTask",
        icon: 'fa-regular fa-user-check',
    },
    {
        type: "TokenEmailTask",
        icon: 'fa-regular fa-key',
    },
    {
        type: "TokenSmsTask",
        icon: 'fa-regular fa-key',
    },
    {
        type: "TokenWhatsappTask",
        icon: 'fa-regular fa-key',
    },
    {
        type: "FormTask",
        icon: 'fa-regular fa-list',
    },
    {
        type: "StepTask",
        icon: 'fa-regular fa-user',
    },
    {
        type: "FtpTask",
        icon: 'fa-regular fa-server',
    },
    {
        type: "EdmTask",
        icon: 'fa-regular fa-circle-notch'
    },
    {
        type: "FirmaArgentinaTask",
        icon: 'fa-regular fa-file-contract',
    },
    {
        type: "DocumentImportTask",
        icon: 'fa-regular fa-file-import',
    }
]