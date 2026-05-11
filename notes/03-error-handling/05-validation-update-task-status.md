# Validation — Update Task Status

## Gambaran Alur

Fitur update status task melibatkan tiga komponen yang bekerja bersama:

```
Request PATCH /tasks/:id/status  { "status": "DONE" }
     ↓
[1] UpdateTaskStatusDto → @IsEnum(TaskStatus) memvalidasi nilai status
     ↓
[2] TaskStatus enum → memastikan hanya nilai yang valid yang diterima
     ↓
[3] Controller → meneruskan data ke service
     ↓
Response: Task yang sudah diperbarui
```

## Komponen 1 — `TaskStatus` Enum

```ts
// task-status.enum.ts
export enum TaskStatus {
  OPEN = 'OPEN',
  IN_PROGRESS = 'IN_PROGRESS',
  DONE = 'DONE',
}
```

### Pemahaman

Enum mendefinisikan **kumpulan nilai yang diizinkan** untuk field status. Dengan enum, TypeScript dan NestJS sama-sama mengetahui nilai mana saja yang valid — tidak ada string sembarangan seperti `"PENDING"` atau `"done"` (lowercase) yang bisa lolos.

| Nilai Enum               | String yang Disimpan |
| ------------------------ | -------------------- |
| `TaskStatus.OPEN`        | `'OPEN'`             |
| `TaskStatus.IN_PROGRESS` | `'IN_PROGRESS'`      |
| `TaskStatus.DONE`        | `'DONE'`             |

> **Manfaat Enum:** Jika suatu saat nilai status perlu ditambah atau diubah, cukup update di satu tempat (file enum) — seluruh kode yang mereferensikannya otomatis mengikuti.

## Komponen 2 — `UpdateTaskStatusDto`

```ts
// update-task-status.dto.ts
import { IsEnum } from 'class-validator';
import { TaskStatus } from './task-status.enum';

export class UpdateTaskStatusDto {
  @IsEnum(TaskStatus) // Validasi: nilai harus salah satu dari TaskStatus enum
  status!: TaskStatus;
}
```

### Pemahaman

| Elemen                | Penjelasan                                                                                              |
| --------------------- | ------------------------------------------------------------------------------------------------------- |
| `@IsEnum(TaskStatus)` | Dekorator dari `class-validator`; memastikan nilai `status` adalah salah satu anggota `TaskStatus` enum |
| `status!: TaskStatus` | Tipe `TaskStatus` membatasi nilai di level TypeScript; `!` adalah definite assignment assertion         |

Jika request dikirim dengan nilai di luar enum (misal: `"PENDING"` atau `"done"`), `ValidationPipe` akan menolak request sebelum sampai ke controller.

## Komponen 3 — Controller

```ts
// tasks.controller.ts
import { Body, Controller, Param, Patch } from '@nestjs/common';
import { Task } from './task.model';
import { UpdateTaskStatusDto } from './dto/update-task-status.dto';

@Patch('/:id/status')
updateTaskStatus(
  @Param('id') id: string,
  @Body() updateTaskStatusDto: UpdateTaskStatusDto,
): Task {
  const { status } = updateTaskStatusDto; // Destructure status dari DTO
  return this.tasksService.updateTaskById(id, status);
}
```

### Pemahaman

| Elemen                  | Penjelasan                                                                                    |
| ----------------------- | --------------------------------------------------------------------------------------------- |
| `@Patch('/:id/status')` | Mendefinisikan endpoint `PATCH /tasks/:id/status` — sesuai konvensi REST untuk update parsial |
| `@Param('id')`          | Mengambil nilai `:id` dari URL                                                                |
| `@Body()`               | Mengambil seluruh body request dan memetakannya ke `UpdateTaskStatusDto`                      |
| `const { status }`      | Destructuring — mengambil hanya field `status` dari DTO untuk diteruskan ke service           |

> **Catatan:** Return type diubah dari `Task | string` menjadi `Task` karena service `updateTaskById` selalu mengembalikan objek `Task` (atau melempar exception jika tidak ditemukan — bukan string).

## Cara Kerja Lengkap

```
PATCH /tasks/abc-123/status  { "status": "IN_PROGRESS" }
     ↓
ValidationPipe aktif (global)
class-transformer: body → instance UpdateTaskStatusDto
@IsEnum(TaskStatus): "IN_PROGRESS" → valid ✓
     ↓
updateTaskStatus(id: "abc-123", dto: { status: "IN_PROGRESS" })
     ↓
tasksService.updateTaskById("abc-123", "IN_PROGRESS")
     ↓
200 OK → { id: "abc-123", title: "...", status: "IN_PROGRESS" }
```

```
PATCH /tasks/abc-123/status  { "status": "SELESAI" }
     ↓
ValidationPipe aktif
@IsEnum(TaskStatus): "SELESAI" tidak ada di enum → GAGAL ✗
     ↓
400 Bad Request:
{
  "statusCode": 400,
  "message": ["status must be one of the following values: OPEN, IN_PROGRESS, DONE"],
  "error": "Bad Request"
}
     ↓
Controller TIDAK dipanggil
```

> **Selanjutnya:** [Validating Task Filtering & Search](./06-validating-task-filtering-search.md)
