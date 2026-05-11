# Error Handling — Non Existing Task

## Konsep: Melempar HTTP Exception di NestJS

Ketika sebuah resource tidak ditemukan, NestJS menyediakan kelas exception bawaan yang secara otomatis diubah menjadi respons HTTP yang sesuai. Tidak perlu membuat response error secara manual.

> **Manfaat Utama:** Exception yang dilempar di dalam service atau handler akan ditangkap oleh **Global Exception Filter** milik NestJS, lalu dikembalikan ke client sebagai respons HTTP terstruktur — tanpa kode tambahan.

## Implementasi `getTaskById`

```ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { Task } from './task.model';

@Injectable()
export class TasksService {
  getTaskById(id: string): Task {
    // Cari task di array berdasarkan id yang cocok
    const taskFound = this.tasks.find((task) => task.id === id);

    // Jika tidak ditemukan, lempar NotFoundException
    if (!taskFound) {
      throw new NotFoundException(`Task with id "${id}" not found!`);
      // Exception ini ditangkap oleh Global Exception Filter NestJS
    }

    return taskFound; // Kembalikan task jika ditemukan
  }
}
```

## Pemahaman Setiap Bagian

### `Array.find()`

```ts
const taskFound = this.tasks.find((task) => task.id === id);
```

`Array.find()` mengiterasi setiap elemen dan mengembalikan **elemen pertama** yang memenuhi kondisi. Jika tidak ada yang cocok, nilainya adalah `undefined`.

| Kondisi                             | Nilai `taskFound` |
| ----------------------------------- | ----------------- |
| Task dengan `id` ditemukan          | Objek `Task`      |
| Tidak ada task dengan `id` tersebut | `undefined`       |

### `NotFoundException`

```ts
throw new NotFoundException(`Task with id "${id}" not found!`);
```

`NotFoundException` adalah kelas bawaan `@nestjs/common` yang merepresentasikan HTTP **404 Not Found**. NestJS menyediakan exception serupa untuk status HTTP umum lainnya:

| Kelas Exception         | HTTP Status      |
| ----------------------- | ---------------- |
| `NotFoundException`     | 404 Not Found    |
| `BadRequestException`   | 400 Bad Request  |
| `UnauthorizedException` | 401 Unauthorized |
| `ForbiddenException`    | 403 Forbidden    |
| `ConflictException`     | 409 Conflict     |

## Cara Kerja Lengkap

```
GET /tasks/id-yang-tidak-ada
     ↓
getTaskById('id-yang-tidak-ada') dipanggil
     ↓
this.tasks.find(...) → undefined
     ↓
!taskFound === true → throw new NotFoundException(...)
     ↓
NestJS Global Exception Filter menangkap exception
     ↓
Respons otomatis dikirim ke client:

{
  "statusCode": 404,
  "message": "Task with id \"id-yang-tidak-ada\" not found!",
  "error": "Not Found"
}
```

```
GET /tasks/id-yang-valid
     ↓
getTaskById('id-yang-valid') dipanggil
     ↓
this.tasks.find(...) → { id: '...', title: '...', ... }
     ↓
taskFound ada → tidak masuk blok if
     ↓
return taskFound → data task dikirim ke client sebagai 200 OK
```

> **Catatan Penting:** Pesan string yang dioper ke `NotFoundException` (misal: `` `Task with id "${id}" not found!` ``) akan muncul langsung di field `message` pada respons JSON. Gunakan pesan yang informatif agar mudah di-debug dari sisi client.

> **Selanjutnya:** [Error Handling — Non Existing Task](./03-error-handling-non-existing-task.md)
