// Create a helper file: src/common/utils/mongoose.utils.ts
import { Types } from 'mongoose';

export class MongooseUtils {
  static toObjectId(id: string | Types.ObjectId): Types.ObjectId {
    if (id instanceof Types.ObjectId) {
      return id;
    }
    return new Types.ObjectId(id);
  }

  static toObjectIdOrNull(
    id: string | Types.ObjectId | null | undefined,
  ): Types.ObjectId | null {
    if (!id) return null;
    return this.toObjectId(id as string);
  }
}
