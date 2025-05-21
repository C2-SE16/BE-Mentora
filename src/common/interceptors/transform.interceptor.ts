import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface Response<T> {
  data: T;
}

@Injectable()
export class TransformInterceptor<T>
  implements NestInterceptor<T, Response<T>>
{
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<Response<T>> {
    return next.handle().pipe(
      map((data) => {
        const ctx = context.switchToHttp();
        const response = ctx.getResponse<{ statusCode: number }>();
        const statusCode = response.statusCode;

        // Tránh gọi đến class-transformer bằng cách chỉ trả về dữ liệu nguyên bản
        // Nếu data là một object hoặc mảng phức tạp, hãy chắc chắn rằng nó an toàn
        const safeData = this.makeDataSafe(data, new WeakMap());
        
        return {
          data: safeData as T,
          statusCode,
        };
      }),
    );
  }

  // Phương thức này giúp đảm bảo dữ liệu trả về an toàn mà không cần class-transformer
  private makeDataSafe(data: any, seen: WeakMap<object, any> = new WeakMap()): any {
    if (!data) return data;
    
    // Xử lý kiểu dữ liệu nguyên thủy
    if (typeof data !== 'object') return data;
    
    // Kiểm tra nếu đã xử lý đối tượng này rồi thì trả về phiên bản đã xử lý
    if (seen.has(data)) {
      return seen.get(data);
    }
    
    if (Array.isArray(data)) {
      const safeArray: any[] = [];
      seen.set(data, safeArray);
      for (let i = 0; i < data.length; i++) {
        safeArray[i] = this.makeDataSafe(data[i], seen);
      }
      return safeArray;
    }
    
    // Xử lý đối tượng
    if (data !== null) {
      // Nếu đối tượng có phương thức toJSON (như Date), hãy sử dụng nó
      if (typeof data.toJSON === 'function') {
        return data.toJSON();
      }
      
      // Tạo một đối tượng mới chỉ với các thuộc tính dữ liệu
      const safeObj = {};
      seen.set(data, safeObj);
      
      for (const key in data) {
        if (Object.prototype.hasOwnProperty.call(data, key) && typeof data[key] !== 'function') {
          safeObj[key] = this.makeDataSafe(data[key], seen);
        }
      }
      return safeObj;
    }
    
    return data;
  }
}
