# Error Handling — Delete Non Existing Task

## Konsep: Strategi Deteksi dengan `filter()`

Berbeda dari `getTaskById` yang menggunakan `find()` untuk mencari task terlebih dahulu, `deleteTaskById` menggunakan pendekatan yang lebih efisien: **filter sekaligus, deteksi setelahnya**.

Idenya sederhana — jika panjang array setelah di-filter **sama** dengan sebelumnya, berarti tidak ada elemen yang terhapus, artinya task dengan `id` tersebut tidak ada.

## Implementasi `deleteTaskById`

```ts
import { Injectable, NotFoundException } from '@nestjs/common';

@Injectable()
export class TasksService {
  deleteTaskById(id: string): void {
    // Buat array baru yang hanya berisi task dengan id SELAIN id yang diminta
    const newTasks = this.tasks.filter((task) => task.id !== id);

    // Jika panjang array tidak berubah → tidak ada task yang dihapus → id tidak ditemukan
    if (newTasks.length === this.tasks.length) {
      throw new NotFoundException(`Task with id "${id}" not found`);
    }

    // Timpa array lama dengan array yang sudah difilter
    this.tasks = newTasks;
  }
}
```

> **Catatan Kode:** Operator `!=` pada kode asli diganti menjadi `!==` (strict inequality). Ini adalah praktik terbaik TypeScript — `!==` membandingkan nilai **dan** tipe data, sehingga menghindari bug tersembunyi akibat _type coercion_.

## Pemahaman Setiap Bagian

### `Array.filter()` sebagai Mekanisme Hapus

```ts
const newTasks = this.tasks.filter((task) => task.id !== id);
```

`Array.filter()` mengembalikan array **baru** berisi semua elemen yang memenuhi kondisi. Elemen yang **tidak** memenuhi kondisi (yaitu task dengan `id` yang cocok) secara otomatis terbuang.

| Kondisi                    | Hasil `newTasks`                                     |
| -------------------------- | ---------------------------------------------------- |
| Task dengan `id` ditemukan | Array baru tanpa task tersebut (panjang berkurang 1) |
| Task dengan `id` tidak ada | Array identik dengan `this.tasks` (panjang sama)     |

### Deteksi Kegagalan via Perbandingan Panjang

```ts
if (newTasks.length === this.tasks.length) {
  throw new NotFoundException(`Task with id "${id}" not found`);
}
```

Ini adalah cara cerdas mendeteksi kegagalan tanpa pencarian terpisah. Jika `filter()` tidak membuang elemen apapun, panjang array tidak berubah — dan itu berarti `id` yang diminta tidak ada.

### Penggantian Array

```ts
this.tasks = newTasks;
```

Karena `filter()` menghasilkan array **baru** (tidak mengubah array asli), langkah ini wajib dilakukan untuk mengganti data lama dengan data yang sudah diperbarui.

## Perbandingan: `find()` + `splice()` vs `filter()`

| Aspek             | `find()` lalu hapus manual         | `filter()` langsung             |
| ----------------- | ---------------------------------- | ------------------------------- |
| Langkah           | 2 (cari dulu, hapus kemudian)      | 1 (filter sekaligus)            |
| Mutasi array asli | Ya (`splice()` mengubah array)     | Tidak (menghasilkan array baru) |
| Deteksi tidak ada | Cek hasil `find()` === `undefined` | Cek perubahan `.length`         |
| Keamanan data     | Lebih rentan side effect           | Lebih aman (immutable approach) |

## Cara Kerja Lengkap

```
DELETE /tasks/id-yang-tidak-ada
     ↓
deleteTaskById('id-yang-tidak-ada') dipanggil
     ↓
filter() → tidak ada task yang dibuang
newTasks.length === this.tasks.length → true
     ↓
throw new NotFoundException(...)
     ↓
NestJS Global Exception Filter menangkap
     ↓
{
  "statusCode": 404,
  "message": "Task with id \"id-yang-tidak-ada\" not found",
  "error": "Not Found"
}
```

```
DELETE /tasks/id-yang-valid
     ↓
deleteTaskById('id-yang-valid') dipanggil
     ↓
filter() → task ditemukan dan dibuang dari array
newTasks.length < this.tasks.length → kondisi if tidak terpenuhi
     ↓
this.tasks = newTasks  ← array diperbarui
     ↓
Method selesai → 200 OK (atau 204 No Content jika dikonfigurasi)
```

> **Selanjutnya:** [Validation Update Task Status](./05-validation-update-task-status.md)
