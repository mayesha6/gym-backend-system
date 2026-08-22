// import { Query } from "mongoose";
// import { excludeField } from "./constant";

// export class QueryBuilder<T> {
//   public modelQuery: Query<T[], T>;
//   public readonly query: Record<string, string>;

//   constructor(modelQuery: Query<T[], T>, query: Record<string, string>) {
//     // this.modelQuery = modelQuery;
//     this.modelQuery = modelQuery.lean<T[]>();
//     this.query = query;
//   }

//   filter(): this {
//     const filter = { ...this.query };

//     for (const field of excludeField) {
//       // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
//       delete filter[field];
//     }

//     this.modelQuery = this.modelQuery.find(filter); // Tour.find().find(filter)

//     return this;
//   }

//   search(searchableField: string[]): this {
//     const searchTerm = this.query.searchTerm || "";
//     const searchQuery = {
//       $or: searchableField.map((field) => ({
//         [field]: { $regex: searchTerm, $options: "i" },
//       })),
//     };
//     this.modelQuery = this.modelQuery.find(searchQuery);
//     return this;
//   }

//   sort(): this {
//     const sort = this.query.sort || "-createdAt";

//     this.modelQuery = this.modelQuery.sort(sort);

//     return this;
//   }
//   fields(): this {
//     const fields = this.query.fields?.split(",").join(" ") || "";

//     this.modelQuery = this.modelQuery.select(fields).lean<T[]>();

//     return this;
//   }
//   paginate(): this {
//     const page = Number(this.query.page) || 1;
//     const limit = Number(this.query.limit) || 10;
//     const skip = (page - 1) * limit;

//     this.modelQuery = this.modelQuery.skip(skip).limit(limit);

//     return this;
//   }

//   build() {
//     return this.modelQuery;
//   }

//   async getMeta() {
//     const totalDocuments = await this.modelQuery.model.countDocuments();

//     const page = Number(this.query.page) || 1;
//     const limit = Number(this.query.limit) || 10;

//     const totalPage = Math.ceil(totalDocuments / limit);

//     return { page, limit, total: totalDocuments, totalPage };
//   }
// }



import { Query } from "mongoose";
import { excludeField } from "./constant";

export class QueryBuilder<T> {
  public modelQuery: Query<T[], T>;
  public readonly query: Record<string, string>;
  private baseQuery: Query<T[], T>;
  private filterQuery: any = {};

  constructor(modelQuery: Query<T[], T>, query: Record<string, string>) {
    this.baseQuery = modelQuery;
    this.modelQuery = modelQuery.lean<T[]>();
    this.query = query;
  }

  // =====================================
  // 🎯 FILTER
  // =====================================
  filter(): this {
    const filter = { ...this.query };

    for (const field of excludeField) {
      delete filter[field];
    }

    this.filterQuery = { ...filter };

    this.modelQuery = this.modelQuery.find(this.filterQuery);
console.log("FILTER METHOD QUERY:", this.query);
    return this;
  }

  // =====================================
  // 🔎 SEARCH (FIXED - MAIN UPDATE)
  // =====================================
  search(searchableField: string[]): this {
    // 🔥 FIX: support both searchTerm & search
    const rawSearch =
      this.query.searchTerm || this.query.search || "";

    const searchTerm = rawSearch.trim();

    // 🔥 FIX: if no search input, skip search stage
    if (!searchTerm) return this;

    // 🔥 FIX: merge into same filterQuery (no override issue)
    this.filterQuery.$or = searchableField.map((field) => ({
      [field]: {
        $regex: searchTerm,
        $options: "i", // case insensitive
      },
    }));

    this.modelQuery = this.modelQuery.find(this.filterQuery);

    return this;
  }

  // =====================================
  // ↕️ SORT
  // =====================================
  sort(): this {
    const sort = this.query.sort || "-createdAt";

    this.modelQuery = this.modelQuery.sort(sort);

    return this;
  }

  // =====================================
  // 📌 FIELDS
  // =====================================
  fields(): this {
    const fields = this.query.fields?.split(",").join(" ") || "";

    if (fields) {
      this.modelQuery = this.modelQuery.select(fields).lean<T[]>();
    }

    return this;
  }

  // =====================================
  // 📄 PAGINATION
  // =====================================
  paginate(): this {
    const page = Number(this.query.page) || 1;
    const limit = Number(this.query.limit) || 10;
    const skip = (page - 1) * limit;

    this.modelQuery = this.modelQuery.skip(skip).limit(limit);

    return this;
  }

  // =====================================
  // 🚀 EXECUTE QUERY
  // =====================================
  build() {
    return this.modelQuery;
  }

  // =====================================
  // 📊 META (SAFE COUNT)
  // =====================================
  async getMeta() {
    const totalDocuments = await this.baseQuery.model.countDocuments(
      this.modelQuery.getFilter()
    );

    const page = Number(this.query.page) || 1;
    const limit = Number(this.query.limit) || 10;

    return {
      page,
      limit,
      total: totalDocuments,
      totalPage: Math.ceil(totalDocuments / limit),
    };
  }
}