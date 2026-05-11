# Creating Tasks Repository

## Gambaran Alur

Fitur ini menghubungkan NestJS dengan database PostgreSQL menggunakan **TypeORM**. Ada empat komponen yang bekerja bersama:

```
AppModule
  └── TypeOrmModule.forRoot()     → koneksi database (sekali, global)
        ↓
TasksModule
  └── TypeOrmModule.forFeature()  → daftarkan entity & repository (per modul)
        ↓
TaskRepository extends Repository<Task>  → operasi database untuk Task
        ↓
Task Entity  → representasi tabel di database
```

## Komponen 1 — `Task` Entity

```ts
// task.entity.ts
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { TaskStatus } from './task-status.enum';

@Entity() // Menandai kelas ini sebagai tabel di database
export class Task {
  @PrimaryGeneratedColumn('uuid') // Auto-generate UUID sebagai primary key
  id?: string;

  @Column() // Kolom tabel biasa, wajib diisi
  title!: string;

  @Column()
  description!: string;

  @Column()
  status?: TaskStatus; // Opsional karena diberi nilai default saat task dibuat
}
```

### Pemahaman Dekorator TypeORM

| Dekorator                         | Fungsi                                                   |
| --------------------------------- | -------------------------------------------------------- |
| `@Entity()`                       | Mendaftarkan kelas sebagai tabel di database             |
| `@PrimaryGeneratedColumn('uuid')` | Kolom primary key yang di-generate otomatis sebagai UUID |
| `@Column()`                       | Kolom tabel reguler                                      |

### Mengapa `id` Opsional (`?`)?

`id` diberi tanda `?` karena sebelum di-save ke database, objek `Task` belum memiliki `id` — TypeORM yang mengisinya secara otomatis saat `INSERT`. Setelah tersimpan, `id` selalu ada.

## Komponen 2 — `TaskRepository`

```ts
// task.repository.ts
import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { Task } from './task.entity';

@Injectable()
export class TaskRepository extends Repository<Task> {
  // Kosong untuk sekarang
  // Method kustom untuk query yang lebih kompleks akan ditambahkan di sini
}
```

### Pemahaman

`Repository<Task>` dari TypeORM sudah menyediakan method CRUD bawaan:

| Method Bawaan | Fungsi                                     |
| ------------- | ------------------------------------------ |
| `find()`      | Ambil semua record                         |
| `findOne()`   | Ambil satu record berdasarkan kondisi      |
| `save()`      | Insert atau update record                  |
| `delete()`    | Hapus record                               |
| `create()`    | Buat instance entity baru (belum disimpan) |

Dengan meng-extend `Repository<Task>`, `TaskRepository` mewarisi semua method di atas dan bisa ditambahkan method kustom sesuai kebutuhan.

## Komponen 3 — `TasksModule`

```ts
// tasks.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TaskRepository } from './task.repository';
import { TasksController } from './tasks.controller';
import { TasksService } from './tasks.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([TaskRepository]), // Daftarkan repository ke modul ini
  ],
  controllers: [TasksController],
  providers: [TasksService],
})
export class TasksModule {}
```

### Pemahaman: `forFeature()`

`TypeOrmModule.forFeature()` mendaftarkan entity dan repository **hanya untuk scope modul ini**. Repository yang didaftarkan di sini bisa di-inject ke service dalam modul yang sama.

## Komponen 4 — `AppModule` (Root)

```ts
// app.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TasksModule } from './tasks/tasks.module';

@Module({
  imports: [
    TasksModule,
    TypeOrmModule.forRoot({
      type: 'postgres', // Jenis database
      host: 'localhost', // Host database
      port: 5432, // Port default PostgreSQL
      username: 'postgres', // Username database
      password: 'postgres', // Password database
      database: 'task-management', // Nama database
      autoLoadEntities: true, // Otomatis load entity yang didaftarkan via forFeature()
      synchronize: true, // Sinkronkan schema otomatis (hanya untuk development!)
    }),
  ],
})
export class AppModule {}
```

### Pemahaman: Pola `forRoot` vs `forFeature`

| Method         | Digunakan Di          | Dipanggil | Fungsi                                           |
| -------------- | --------------------- | --------- | ------------------------------------------------ |
| `forRoot()`    | `AppModule`           | Sekali    | Konfigurasi koneksi database global              |
| `forFeature()` | Setiap feature module | Per modul | Daftarkan entity/repository untuk modul tersebut |

> **Aturan Sederhana:** `forRoot` = setup koneksi (satu kali di root). `forFeature` = daftarkan entity yang dibutuhkan modul tersebut.

> **Peringatan `synchronize: true`:** Opsi ini secara otomatis mengubah schema database agar sesuai dengan entity. **Jangan gunakan di production** — perubahan schema yang tidak disengaja bisa menghapus data. Gunakan migration sebagai gantinya.

## Cara Kerja Lengkap

```
Aplikasi Start
     ↓
AppModule: TypeOrmModule.forRoot() → buka koneksi ke PostgreSQL
     ↓
TasksModule: TypeOrmModule.forFeature([TaskRepository])
→ TaskRepository tersedia untuk di-inject di TasksService
     ↓
Request masuk ke TasksController
     ↓
TasksService memanggil method di TaskRepository
(misal: taskRepository.find(), taskRepository.save())
     ↓
TypeORM menerjemahkan ke query SQL → eksekusi ke PostgreSQL
     ↓
Hasil dikembalikan sebagai instance Task entity
```

> **Selanjutnya:** [Refactoring Tasks Service](./11-refactoring-tasks-service.md)
