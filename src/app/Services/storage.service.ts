import { Injectable } from '@angular/core';
import { Preferences } from '@capacitor/preferences';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { FilePicker } from '@capawesome/capacitor-file-picker';
import { Share } from '@capacitor/share';
import { ISubscription } from '../tab-overview/Interfaces/subscriptionInterface';
import { ISettings } from '../tab-settings/Interfaces/settingsInterface';
import { ToastController } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';

const BACKUP_FILE_NAME = 'subz-backup.json';

@Injectable({
  providedIn: 'root'
})
export class StorageService {
  defaultSettings: ISettings = {
    hideOverviewHelperTextGeneral: false,
    hideOverviewHelperTextMenuBar: false
  }

  constructor(
    private toastController: ToastController,
    private translateService: TranslateService) { }

  async retrieveSubscriptionsFromStorage(): Promise<ISubscription[]> {
    const entries = await Preferences.get({ key: 'subscriptions' });
    if (entries.value) {
      return JSON.parse(entries.value);
    } else {
      return [];
    }
  }

  async saveSubscriptionsToStorage(entries: ISubscription[]) {
    await Preferences.set({
      key: 'subscriptions',
      value: JSON.stringify(entries)
    });
  }

  async retrieveSettingsFromStorage(): Promise<ISettings> {
    const settingsString = await Preferences.get({ key: 'settings' });
    if (settingsString.value) {
      return JSON.parse(settingsString.value);
    } else {
      return this.defaultSettings;
    }
  }

  async saveSettingsToStorage(settings: ISettings) {
    await Preferences.set({
      key: 'settings',
      value: JSON.stringify(settings)
    });
  }

  async getAllData(): Promise<string> {
    const entries = await this.retrieveSubscriptionsFromStorage();
    const set = await this.retrieveSettingsFromStorage();

    const backup = {
      subscriptions: entries,
      settings: set
    };

    return JSON.stringify(backup);
  }

  /**
   * Writes the backup to the app's own cache -- which needs no storage
   * permission -- and hands it to the system share sheet, so the user chooses
   * where it ends up. Writing straight to /Documents stopped being possible at
   * targetSdk 30.
   */
  async backupAllDataAndroid() {
    const backup = await this.getAllData();

    try {
      const { uri } = await Filesystem.writeFile({
        path: BACKUP_FILE_NAME,
        data: backup,
        directory: Directory.Cache,
        encoding: Encoding.UTF8
      });

      await Share.share({ title: BACKUP_FILE_NAME, files: [uri] });
    } catch (e) {
      if (this.isUserCancellation(e)) { return; }

      this.translateService.get('TABS.SETTINGS.BACKUP_ERROR').subscribe(BACKUP_ERROR => {
        this.toastMessage(BACKUP_ERROR);
      });
    }
  }

  /**
   * Imports a backup through the system file picker. Since targetSdk 30 the app
   * can no longer read shared storage directly, so the user grants access to the
   * single file they pick -- which is also what makes importing a backup written
   * by a different app (such as an older install) work.
   */
  async restoreAllDataAndroid(mergeWithCurrent?: boolean) {
    let backup: string;

    try {
      // Deliberately unfiltered: file managers report .json as anything from
      // application/json to application/octet-stream, and a type filter that
      // hides the user's own backup is a worse failure than a longer list.
      const { files } = await FilePicker.pickFiles({ limit: 1, readData: true });
      const file = files[0];

      if (!file?.data) { return; }

      backup = this.decodeBase64(file.data);
    } catch (e) {
      if (this.isUserCancellation(e)) { return; }

      this.translateService.get('TABS.SETTINGS.RESTORE_BACKUP_ERROR_ANDROID').subscribe(RESTORE_BACKUP_ERROR_ANDROID => {
        this.toastMessage(RESTORE_BACKUP_ERROR_ANDROID);
      });
      return;
    }

    // restoreAllData reports its own success and failure
    await this.restoreAllData(backup, mergeWithCurrent);
  }

  /** The picker returns file contents base64-encoded; decode as UTF-8. */
  private decodeBase64(data: string): string {
    return new TextDecoder().decode(Uint8Array.from(atob(data), character => character.charCodeAt(0)));
  }

  /** Backing out of the share sheet or the file picker is not an error. */
  private isUserCancellation(e: unknown): boolean {
    const message = (e instanceof Error ? e.message : String(e)).toLowerCase();
    return message.includes('cancel') || message.includes('abort');
  }

  /**
   * Restores passed data
   * @param backup Backup data which shall be restored like { subscriptions: ISubscription[], settings: ISettings }
   * @param mergeWithCurrent If true, backup and current subscriptions will be merged by their id, keeps newer
   * subscription if lastEdited property is present, else keeps the backup subscription
   */
  async restoreAllData(backup: string, mergeWithCurrent?: boolean) {
    let backupObject: { subscriptions: ISubscription[], settings: ISettings };
    try {
      backupObject = JSON.parse(backup);

      if (!backupObject.hasOwnProperty('subscriptions') && !backupObject.hasOwnProperty('settings')) {
        throw Error;
      }

      // SUBSCRIPTIONS
      let subscriptions: ISubscription[] = backupObject.subscriptions;
      let isValid = true;

      for (const subscription of subscriptions) {
        // Mandatory fields
        isValid = 'id' in subscription && typeof subscription.id === 'number' &&
                  'name' in subscription && typeof subscription.name === 'string' &&
                  'cost' in subscription && typeof subscription.cost === 'number' &&
                  'color' in subscription && typeof subscription.color === 'string' &&
                  'billingStart' in subscription && typeof subscription.billingStart === 'string' &&
                  'billingEvery' in subscription && typeof subscription.billingEvery === 'number' &&
                  'billingInterval' in subscription && typeof subscription.billingInterval === 'string' &&
                  'contractStart' in subscription && typeof subscription.contractStart === 'string' &&
                  'minimumContractDuration' in subscription && typeof subscription.minimumContractDuration === 'number' &&
                  'minimumContractDurationInterval' in subscription && typeof subscription.minimumContractDurationInterval === 'string' &&
                  'extensionAfterMinimumContractDurationEvery' in subscription
                    && typeof subscription.extensionAfterMinimumContractDurationEvery === 'number' &&
                  'extensionAfterMinimumContractDurationInterval' in subscription
                    && typeof subscription.extensionAfterMinimumContractDurationInterval === 'string' &&
                  'cancelationPeriodEvery' in subscription && typeof subscription.cancelationPeriodEvery === 'number' &&
                  'cancelationPeriodInterval' in subscription && typeof subscription.cancelationPeriodInterval === 'string';
        if (!isValid) { throw Error; }

        // Optional fields
        if ('description' in subscription) { this.throwErrorHelper(typeof subscription.description !== 'string'); }
        if ('notificationBeforeCancelationPeriodInDays' in subscription) {
          this.throwErrorHelper(typeof subscription.notificationBeforeCancelationPeriodInDays !== 'number'
            && typeof subscription.notificationBeforeCancelationPeriodInDays !== 'object');
        }
        if ('lastEdited' in subscription) {
          this.throwErrorHelper(typeof subscription.lastEdited !== 'number' && typeof subscription.lastEdited !== 'object'); }
        if ('created' in subscription) {
          this.throwErrorHelper(typeof subscription.created !== 'number' && typeof subscription.created !== 'object'); }
      }

      // SETTINGS
      const settings: ISettings = backupObject.settings;

      if ('forceDarkMode' in settings) { this.throwErrorHelper(typeof settings.forceDarkMode !== 'boolean'); }
      if ('currency' in settings) { this.throwErrorHelper(typeof settings.currency !== 'string'); }
      if ('dateFormat' in settings) { this.throwErrorHelper(typeof settings.dateFormat !== 'string'); }
      if ('notificationBeforeCancelationPeriodInDays' in settings) {
        // Can be null, so it can be an object
        this.throwErrorHelper(typeof settings.notificationBeforeCancelationPeriodInDays !== 'number'
          && typeof settings.notificationBeforeCancelationPeriodInDays !== 'object');
      }
      if ('defaultBillingInterval' in settings) { this.throwErrorHelper(typeof settings.defaultBillingInterval !== 'string'); }
      if ('defaultSortBy' in settings) { this.throwErrorHelper(typeof settings.defaultSortBy !== 'string'); }
      if ('hideOverviewHelperTextGeneral' in settings) {
        this.throwErrorHelper(typeof settings.hideOverviewHelperTextGeneral !== 'boolean'); }
      if ('hideOverviewHelperTextMenuBar' in settings) {
        this.throwErrorHelper(typeof settings.hideOverviewHelperTextMenuBar !== 'boolean'); }

      // Merge current subscriptions with backup based on id
      if (mergeWithCurrent) {
        const currentSubscriptions = await this.retrieveSubscriptionsFromStorage();

        for (let currentSubscription of currentSubscriptions) {
          // Check if subscription with same id is present in backup and current subscriptions
          let backupSubscriptionIndex = subscriptions.findIndex(sub => sub.id === currentSubscription.id);

          if (backupSubscriptionIndex !== -1) {
            // Check which subscription will be kept based on lastEdited date (4 cases)

            // 1. Case: Both have lastEdited, so use the one with newer date
            if (currentSubscription.lastEdited && subscriptions[backupSubscriptionIndex].lastEdited) {

              if (currentSubscription.lastEdited > subscriptions[backupSubscriptionIndex].lastEdited) {
                subscriptions[backupSubscriptionIndex] = currentSubscription;
              }
              // Otherwise nothing todo, as backup subscription is used

            }
            // 2. Case: Only current subscription has lastEdited (= is newer)
            else if (currentSubscription.lastEdited && !subscriptions[backupSubscriptionIndex].lastEdited) {
              subscriptions[backupSubscriptionIndex] = currentSubscription;
            }
            // 3. Case: Only backup subscription has lastEdited (= is newer)
            else if (!currentSubscription.lastEdited && subscriptions[backupSubscriptionIndex].lastEdited) {
              // Nothing todo, as backup subscription is used
            }
            // 4. Case: Both don't have lastEdited, use the backup one
            else if (!currentSubscription.lastEdited && !subscriptions[backupSubscriptionIndex].lastEdited) {
              // Nothing todo, as backup subscription is used
            }
            else {
              // Invalid case
              throw Error;
            }
          } else {
            // Current subscription can just be appended
            subscriptions.push(currentSubscription);
          }
        }
      }

      this.saveSubscriptionsToStorage(subscriptions);
      this.saveSettingsToStorage(settings);

      this.translateService.get('TABS.SETTINGS.RESTORE_BACKUP_SUCCESS').subscribe(RESTORE_BACKUP_SUCCESS => {
        this.toastMessage(RESTORE_BACKUP_SUCCESS);
      });
    } catch (exception) {
      this.translateService.get('TABS.SETTINGS.RESTORE_BACKUP_ERROR').subscribe(RESTORE_BACKUP_ERROR => {
        this.toastMessage(RESTORE_BACKUP_ERROR);
      });
    }
  }

  throwErrorHelper(boolVar: boolean) {
    if (boolVar) { throw Error; }
  }

  async toastMessage(toastMessage: string) {
    const toast = await this.toastController.create({
      cssClass: 'toast-center-text',
      message: toastMessage,
      duration: 3000
    });
    toast.present();
  }
}
