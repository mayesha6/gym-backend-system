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

export const SettingServices = {
  getGymInfo,
  updateGymInfo,
};
