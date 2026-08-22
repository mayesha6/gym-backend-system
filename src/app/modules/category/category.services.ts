import httpStatus from "http-status-codes";
import AppError from "../../errorHelpers/AppError";
import { ICategory } from "./category.interface";
import { Category } from "./category.model";

const createCategory = async (payload: ICategory) => {
  const existingCategory = await Category.findOne({ name: payload.name });
  if (existingCategory) {
    throw new AppError(httpStatus.BAD_REQUEST, "Category with this name already exists");
  }
  const category = await Category.create(payload);
  return category;
};

const getAllCategories = async () => {
  const categories = await Category.find({ isActive: true }).sort({ name: 1 });
  return categories;
};

const updateCategory = async (id: string, payload: Partial<ICategory>) => {
  const category = await Category.findById(id);
  if (!category) {
    throw new AppError(httpStatus.NOT_FOUND, "Category not found");
  }
  const updatedCategory = await Category.findByIdAndUpdate(id, payload, {
    new: true,
    runValidators: true,
  });
  return updatedCategory;
};

const deleteCategory = async (id: string) => {
  const category = await Category.findByIdAndUpdate(
    id,
    { isActive: false },
    { new: true }
  );
  if (!category) {
    throw new AppError(httpStatus.NOT_FOUND, "Category not found");
  }
  return category;
};

export const CategoryServices = {
  createCategory,
  getAllCategories,
  updateCategory,
  deleteCategory,
};
