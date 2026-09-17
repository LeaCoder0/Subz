// Don't forget to apply changes to the validation in storage.service.restoreAllData() corresponding to the changes here
export interface IBook {
    id: number; // unique, same random scheme as ISubscription.id
    name: string;
    order: number; // position in the books list, ascending
    created?: number; // Unix millis since 1970 using Date.now()
    lastEdited?: number; // Unix millis since 1970 using Date.now()
}
