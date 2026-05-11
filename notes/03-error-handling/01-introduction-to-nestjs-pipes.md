# NestJS Pipes — Panduan Lengkap

## Apa Itu Pipe?

Pipe adalah kelas khusus di NestJS yang dieksekusi **tepat sebelum** route handler dipanggil. Pipe bekerja pada argumen yang akan diterima oleh handler.

Pipe memiliki dua tanggung jawab utama:

- **Data Transformation** — mengubah input ke format yang diinginkan (misal: string → number)
- **Data Validation** — memvalidasi input; jika tidak valid, pipe melempar exception sebelum handler dijalankan

> **Catatan Penting:** Exception yang dilempar oleh pipe akan ditangani secara otomatis oleh NestJS dan diubah menjadi respons error yang sesuai. Pipe juga mendukung operasi **asynchronous**.

## Pipe Bawaan NestJS

NestJS menyediakan beberapa pipe siap pakai dari modul `@nestjs/common`.

### ValidationPipe

Memvalidasi seluruh objek terhadap sebuah kelas (sangat cocok digunakan bersama **DTO / Data Transfer Object**). Jika ada properti yang tidak cocok dengan tipe yang diharapkan, validasi akan gagal dan error dikembalikan ke client.

### ParseIntPipe

Secara default, semua argumen dari request masuk sebagai tipe **string**. `ParseIntPipe` memvalidasi bahwa argumen tersebut dapat dikonversi menjadi angka. Jika berhasil, argumen akan diteruskan ke handler sebagai tipe `number`.

## Membuat Custom Pipe

Setiap custom pipe wajib mengikuti aturan berikut:

- Didekorasi dengan `@Injectable()`
- Mengimplementasikan interface `PipeTransform`
- Memiliki method `transform()` yang akan dipanggil oleh NestJS

### Parameter Method `transform()`

| Parameter               | Keterangan                                     |
| ----------------------- | ---------------------------------------------- |
| `value`                 | Nilai argumen yang sedang diproses             |
| `metadata` _(opsional)_ | Objek berisi metadata tentang argumen tersebut |

> Nilai yang di-`return` dari `transform()` akan diteruskan langsung ke route handler. Jika exception dilempar, NestJS akan mengirimkannya sebagai respons error ke client.

## Cara Menerapkan Pipe

### 1. Handler-Level Pipe

Didefinisikan pada level handler menggunakan dekorator `@UsePipes()`. Pipe ini akan memproses **semua parameter** dari request yang masuk.

```js
@Post()
@UsePipes(SomePipe) // Berlaku untuk semua parameter di handler ini
createTask(
  @Body('description') description
) {
  // handler logic
}
```

#### Cara Kerja

NestJS membaca dekorator `@UsePipes`, lalu menjalankan `SomePipe` pada setiap argumen sebelum `createTask()` dipanggil.

### 2. Parameter-Level Pipe

Didefinisikan langsung pada parameter tertentu. Hanya parameter yang didekorasi yang akan diproses oleh pipe tersebut.

```js
@Post()
createTask(
  @Body('description', SomePipe) description // Hanya 'description' yang diproses
) {
  // handler logic
}
```

#### Cara Kerja

NestJS menjalankan `SomePipe` hanya pada argumen `description`, parameter lain tidak terpengaruh.

### 3. Global Pipe

Didefinisikan di level aplikasi dan berlaku untuk **semua** request yang masuk ke seluruh aplikasi.

```js
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe()); // Berlaku secara global
  await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();
```

#### Cara Kerja

Setiap request yang masuk ke aplikasi akan otomatis melewati `ValidationPipe` sebelum mencapai handler manapun.

## Parameter-Level vs Handler-Level: Mana yang Lebih Baik?

| Aspek                   | Parameter-Level                       | Handler-Level                     |
| ----------------------- | ------------------------------------- | --------------------------------- |
| Kode                    | Lebih ringkas per parameter           | Sedikit lebih banyak kode         |
| Maintainability         | Bisa berantakan jika banyak parameter | Lebih mudah dirawat dan diperluas |
| Fleksibilitas           | Hanya parameter tertentu              | Semua parameter sekaligus         |
| Perubahan struktur data | Harus ubah di banyak tempat           | Cukup ubah di dalam pipe saja     |

**Rekomendasi:** Gunakan **handler-level pipe** untuk validasi kompleks atau ketika struktur data kemungkinan akan berubah. Gunakan **parameter-level pipe** untuk transformasi sederhana pada satu parameter saja.

## Alur Lengkap Pipe di NestJS

```
Request masuk
     ↓
[Global Pipe] → validasi/transformasi seluruh aplikasi
     ↓
[Handler-Level Pipe] → validasi/transformasi semua parameter handler
     ↓
[Parameter-Level Pipe] → validasi/transformasi parameter spesifik
     ↓
Route Handler dipanggil dengan argumen yang sudah diproses
     ↓
Response dikembalikan ke client

Jika pipe melempar Exception di langkah manapun:
     → NestJS menangkap exception
     → Diubah menjadi HTTP error response
     → Dikirim ke client (handler TIDAK dipanggil)
```

> **Selanjutnya:** [Validation Pipe — Create Task](./02-validation-pipe-create-task.md)
