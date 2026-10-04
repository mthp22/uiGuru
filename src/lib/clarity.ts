import Clarity from '@microsoft/clarity';

const projectID= import.meta.env.VITE_CLARITY_TOKEN;

export function initialiseClarity(){
    if (!projectID){
        console.warn('Clarity project ID is not configured');
        return;
    }

    Clarity.init(projectID);
}