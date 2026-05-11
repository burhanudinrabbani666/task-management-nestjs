# Validation — Task Filtering & Search

## Gambaran Alur

```
GET /tasks?status=DONE&search=nestjs
     ↓
[1] GetTaskFilterDto → @IsOptional() + @IsEnum() + @IsString() memvalidasi query params
     ↓
[2] Controller → cek apakah ada filter aktif atau tidak
     ↓
[3] Service → terapkan filter secara berantai (chained filtering)
     ↓
Response: array Task yang cocok dengan kriteria
```

## Komponen 1 — `GetTaskFilterDto`

```ts
// get-tasks-filter.dto.ts
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { TaskStatus } from '../task-status.enum';

export class GetTaskFilterDto {
  @IsOptional() // Field ini boleh tidak ada di query
  @IsEnum(TaskStatus) // Jika ada, nilainya harus salah satu dari enum TaskStatus
  status?: TaskStatus;

  @IsOptional() // Field ini boleh tidak ada di query
  @IsString() // Jika ada, nilainya harus bertipe string
  search?: string;
}
```

### Pemahaman: `@IsOptional()`

Dekorator ini mengubah perilaku validasi: jika field **tidak ada** atau bernilai `undefined`, semua validasi lain pada field tersebut **dilewati** sepenuhnya. Validasi hanya berjalan jika field dikirimkan.

| Query yang Dikirim           | Hasil Validasi                                |
| ---------------------------- | --------------------------------------------- |
| `?status=DONE`               | ✓ Valid — `status` cocok dengan enum          |
| `?status=PENDING`            | ✗ Gagal — `PENDING` tidak ada di `TaskStatus` |
| `?search=nestjs`             | ✓ Valid — `search` adalah string              |
| _(tanpa query apapun)_       | ✓ Valid — keduanya opsional, boleh tidak ada  |
| `?status=DONE&search=nestjs` | ✓ Valid — keduanya dikirim dan valid          |

> **Urutan Dekorator:** Letakkan `@IsOptional()` **sebelum** dekorator validasi lainnya. NestJS membaca dekorator dari bawah ke atas, sehingga `@IsOptional()` perlu berada di posisi teratas agar diproses pertama.

## Komponen 2 — Controller

```ts
// tasks.controller.ts
@Get()
getTasks(@Query() filterDto: GetTaskFilterDto): Task[] {
  // Jika ada minimal satu filter aktif, gunakan method filter
  if (Object.keys(filterDto).length) {
    return this.tasksService.getTasksWithFilter(filterDto);
  }
  // Jika tidak ada filter sama sekali, kembalikan semua task
  return this.tasksService.getAllTasks();
}
```

### Pemahaman: `Object.keys(filterDto).length`

Karena `ValidationPipe` tidak menyertakan field `undefined` ke dalam objek DTO, `filterDto` hanya akan berisi field yang benar-benar dikirim dalam query string.

| Kondisi Request          | `filterDto`          | `Object.keys().length` | Method yang Dipanggil  |
| ------------------------ | -------------------- | ---------------------- | ---------------------- |
| `GET /tasks`             | `{}`                 | `0` → falsy            | `getAllTasks()`        |
| `GET /tasks?status=DONE` | `{ status: 'DONE' }` | `1` → truthy           | `getTasksWithFilter()` |
| `GET /tasks?search=api`  | `{ search: 'api' }`  | `1` → truthy           | `getTasksWithFilter()` |

## Komponen 3 — Service

```ts
// tasks.service.ts
getTasksWithFilter(filterDto: GetTaskFilterDto): Task[] {
  const { status, search } = filterDto;

  // Mulai dari seluruh task, lalu sempitkan secara bertahap
  let tasks = this.getAllTasks();

  // Filter berdasarkan status jika diberikan
  if (status) {
    tasks = tasks.filter((task) => task.status === status);
  }

  // Filter berdasarkan kata kunci di title atau description jika diberikan
  if (search) {
    tasks = tasks.filter(
      (task) => task.title.includes(search) || task.description.includes(search)
    );
  }

  return tasks;
}
```

### Pemahaman: Chained Filtering

Setiap blok `if` mempersempit array `tasks` secara bertahap. Hasil filter pertama menjadi input untuk filter berikutnya — bukan memfilter dari awal lagi.

```
getAllTasks() → [T1, T2, T3, T4, T5]  (semua task)
     ↓  filter status === 'DONE'
         [T2, T4]                      (hanya yang DONE)
     ↓  filter includes('nestjs')
         [T4]                          (yang DONE dan mengandung 'nestjs')
```

> **Tips Penyederhanaan Kode:** Blok `if/return true/return false` pada filter `search` bisa ditulis lebih ringkas menjadi satu baris:
>
> ```ts
> tasks = tasks.filter(
>   (task) => task.title.includes(search) || task.description.includes(search),
> );
> ```
>
> Keduanya menghasilkan hasil yang identik — versi ringkas lebih idiomatis di JavaScript/TypeScript.

## Cara Kerja Lengkap

```
GET /tasks?status=IN_PROGRESS&search=api
     ↓
ValidationPipe: filterDto = { status: 'IN_PROGRESS', search: 'api' }
Object.keys(filterDto).length = 2 → truthy
     ↓
getTasksWithFilter({ status: 'IN_PROGRESS', search: 'api' })
     ↓
tasks = getAllTasks()           → semua task
tasks = filter(status)         → hanya task IN_PROGRESS
tasks = filter(search 'api')   → dari IN_PROGRESS, yang mengandung 'api'
     ↓
200 OK → array Task hasil filter

GET /tasks
     ↓
filterDto = {} → Object.keys().length = 0 → falsy
     ↓
getAllTasks() → semua task tanpa filter
     ↓
200 OK → seluruh array Task
```

> **Selanjutnya:** [Validating Task Filtering Search](./06-validating-task-filtering-search.md)
