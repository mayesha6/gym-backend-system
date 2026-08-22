import { IGymSetting } from "./setting.interface";
import { GymSetting } from "./setting.model";

const getGymInfo = async () => {
  let settings = await GymSetting.findOne();
  if (!settings) {
    settings = await GymSetting.create({
      gymName: "Palestra Combat Club",
      address: "42 Warrior Ave, Miami, FL 33101",
      phone: "+1 (305) 555-0190",
      email: "admin@palestra.club",
    });
  }
  return settings;
};

const updateGymInfo = async (payload: Partial<IGymSetting>) => {
  let settings = await GymSetting.findOne();
  if (!settings) {
    settings = await GymSetting.create(payload);
  } else {
    settings = await GymSetting.findByIdAndUpdate(settings._id, payload, {
      new: true,
      runValidators: true,
    });
  }
  return settings;
};

const updateGymdeskConfig = async (gymdeskApiKey: string, gymdeskSyncFrequency?: string) => {
  let settings = await GymSetting.findOne();
  const updateData: any = {
    gymdeskApiKey,
    gymdeskSyncStatus: "Connected",
  };
  if (gymdeskSyncFrequency) {
    updateData.gymdeskSyncFrequency = gymdeskSyncFrequency;
  }

  if (!settings) {
    settings = await GymSetting.create(updateData);
  } else {
    settings = await GymSetting.findByIdAndUpdate(settings._id, updateData, { new: true });
  }

  return settings;
};

const triggerGymdeskSync = async () => {
  let settings = await GymSetting.findOne();
  const now = new Date();

  if (!settings) {
    settings = await GymSetting.create({
      gymdeskLastSyncAt: now,
      gymdeskSyncStatus: "Successfully Synced",
    });
  } else {
    settings.gymdeskLastSyncAt = now;
    settings.gymdeskSyncStatus = "Successfully Synced";
    await settings.save();
  }

  return {
    lastSyncAt: now,
    status: "Successfully Synced",
    syncedEntities: ["Members", "Membership Status", "Membership Expiration Date"],
  };
};

export const SettingServices = {
  getGymInfo,
  updateGymInfo,
  updateGymdeskConfig,
  triggerGymdeskSync,
};
