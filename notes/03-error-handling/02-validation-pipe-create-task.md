# Validation Pipe — Create Task

## Dependensi yang Dibutuhkan

NestJS `ValidationPipe` membutuhkan dua library eksternal untuk bekerja:

| Library             | Peran                                                                       |
| ------------------- | --------------------------------------------------------------------------- |
| `class-validator`   | Menyediakan dekorator validasi seperti `@IsNotEmpty()`, `@IsString()`, dll. |
| `class-transformer` | Mengubah plain object (JSON dari request) menjadi instance kelas DTO        |

```bash
# Install keduanya sekaligus
npm i class-validator class-transformer
```

> **Referensi:** Daftar lengkap dekorator validasi tersedia di [class-validator GitHub](https://github.com/typestack/class-validator)

## Membuat DTO (Data Transfer Object)

DTO adalah kelas yang mendefinisikan **bentuk dan aturan validasi** dari data yang boleh masuk ke sebuah endpoint.

```ts
import { IsNotEmpty } from 'class-validator';

export class CreateTaskDto {
  @IsNotEmpty() // Validasi: field ini tidak boleh kosong atau berisi string kosong
  title!: string;

  @IsNotEmpty() // Validasi: field ini tidak boleh kosong atau berisi string kosong
  description!: string;
}
```

### Pemahaman Kode

| Elemen                       | Penjelasan                                                                                                                                      |
| ---------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| `export class CreateTaskDto` | Kelas biasa TypeScript yang mewakili struktur data request                                                                                      |
| `@IsNotEmpty()`              | Dekorator dari `class-validator`; menandai field yang wajib diisi                                                                               |
| `title!: string`             | Tanda `!` adalah _definite assignment assertion_ TypeScript — memberi tahu compiler bahwa field ini pasti akan diisi (oleh NestJS saat runtime) |

> **Catatan:** DTO bukan interface — harus berupa **kelas**, karena `class-transformer` memerlukan class untuk membuat instance dan `class-validator` memerlukan instance untuk menjalankan dekorator.

## Menerapkan ValidationPipe Secara Global

Daftarkan `ValidationPipe` di `main.ts` agar berlaku untuk seluruh aplikasi:

```ts
// main.ts
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe()); // Aktifkan validasi di seluruh aplikasi
  await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();
```

### Pemahaman Kode

`app.useGlobalPipes(new ValidationPipe())` mendaftarkan pipe ini sebagai interceptor global. Setiap request yang masuk ke endpoint manapun akan:

1. Body/query/param request diubah dari plain JSON → instance kelas DTO oleh `class-transformer`
2. Dekorator validasi pada kelas DTO dijalankan oleh `class-validator`
3. Jika validasi gagal → NestJS otomatis mengembalikan `400 Bad Request` dengan detail error
4. Jika validasi berhasil → handler dipanggil dengan data yang sudah tervalidasi

## Cara Kerja Lengkap

```
POST /tasks  { "title": "", "description": "Belajar NestJS" }
     ↓
[ValidationPipe] menerima body request
     ↓
class-transformer: plain object → instance CreateTaskDto
     ↓
class-validator: jalankan @IsNotEmpty() pada setiap field
     ↓
"title" kosong → validasi GAGAL
     ↓
NestJS kembalikan 400 Bad Request:
{
  "statusCode": 400,
  "message": ["title should not be empty"],
  "error": "Bad Request"
}
     ↓
Handler createTask() TIDAK dipanggil
```

```
POST /tasks  { "title": "Task Baru", "description": "Belajar NestJS" }
     ↓
[ValidationPipe] menerima body request
     ↓
Semua field lulus validasi
     ↓
Handler createTask(dto: CreateTaskDto) dipanggil dengan data valid
```

> **Manfaat Utama:** Dengan mendaftarkan `ValidationPipe` secara global di `main.ts`, setiap DTO di seluruh aplikasi akan otomatis divalidasi tanpa perlu menambahkan `@UsePipes()` di setiap handler secara manual.

> **Selanjutnya:** [Error Handling — Non Existing Task](./03-error-handling-non-existing-task.md)
