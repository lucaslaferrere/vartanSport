import {IWorkflowTaskTemplateSearchResponse} from "@models/response/tasks/iWorkflowTaskTemplateResponse";

export const getCallbacksCount = (data: IWorkflowTaskTemplateSearchResponse[]) => {
    return data.filter(w => w.type === "CallbackTask").length;
}

export const getStepsCount = (data: IWorkflowTaskTemplateSearchResponse[]) => {
    return data.filter(w => w.type === "StepTask").length;
}

export const getNotificationsCount = (data: IWorkflowTaskTemplateSearchResponse[]) => {
    return data.filter(w =>
        w.type === "WhatsappTask" ||
        w.type === "EmailTask" ||
        w.type === "SmsTask"
    ).length;
}

export const getDocumentReadsCount = (data: IWorkflowTaskTemplateSearchResponse[]) => {
    return data.filter(w => w.type === "DocumentReadTask").length;
}

export const getFormsCount = (data: IWorkflowTaskTemplateSearchResponse[]) => {
    return data.filter(w => w.type === "FormTask").length;
}

export const getHelpPanelsCount = (data: IWorkflowTaskTemplateSearchResponse[]) => {
    return data.filter(w => w.type === "HelpPanelTask").length;
}

export const getUploadsCount = (data: IWorkflowTaskTemplateSearchResponse[]) => {
    return data.filter(w =>
        w.type === "FtpTask" ||
        w.type === "EdmTask"
    ).length;
}

export const getFirmasArgentinaCount = (data: IWorkflowTaskTemplateSearchResponse[]) => {
    return data.filter(w => w.type === "FirmaArgentinaTask").length;
}

export const getDocumentImportsCount = (data: IWorkflowTaskTemplateSearchResponse[]) => {
    return data.filter(w => w.type === "DocumentImportTask").length;
}

export const getEvidencesCount = (data: IWorkflowTaskTemplateSearchResponse[]) => {
    return data.filter(w =>
        w.type === "PhotoTask" ||
        w.type === "SignatureTask" ||
        w.type === "DniFrontTask" ||
        w.type === "DniBackTask" ||
        w.type === "LiveTask" ||
        w.type === "FaceCompareTask" ||
        w.type === "TokenEmailTask" ||
        w.type === "TokenSmsTask" ||
        w.type === "TokenWhatsappTask"
    ).length;
}