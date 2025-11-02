# 🔍 Implementasi Searchable Select dengan Debounce

## 📋 Ringkasan
Fitur pencarian dengan debounce telah ditambahkan ke komponen Select untuk memudahkan user mencari data ketika ada banyak pilihan. Implementasi ini meningkatkan User Experience (UX) secara signifikan di dashboard admin.

## 🎯 Komponen yang Diupdate

### 1. **SearchableSelect Component** (Baru)
**Lokasi:** `src/components/ui/searchable-select.tsx`

Komponen baru yang merupakan enhanced version dari komponen Select standar dengan fitur:
- ✅ Input field untuk search
- ✅ Debounce 300ms untuk performa optimal
- ✅ Filter real-time
- ✅ Pesan "tidak ada data" ketika hasil kosong
- ✅ Fully compatible dengan komponen Select yang ada

**Cara Penggunaan:**
```tsx
import { 
  SearchableSelect, 
  SearchableSelectContent, 
  SearchableSelectItem, 
  SearchableSelectTrigger, 
  SearchableSelectValue 
} from "@/components/ui/searchable-select";

const [search, setSearch] = useState("");

// Filter data
const filteredData = data.filter(item => 
  item.name.toLowerCase().includes(search.toLowerCase())
);

<SearchableSelect value={value} onValueChange={setValue}>
  <SearchableSelectTrigger>
    <SearchableSelectValue placeholder="Pilih..." />
  </SearchableSelectTrigger>
  <SearchableSelectContent 
    searchable 
    searchPlaceholder="Cari..."
    onSearchChange={setSearch}
  >
    {filteredData.map(item => (
      <SearchableSelectItem key={item.id} value={item.id}>
        {item.name}
      </SearchableSelectItem>
    ))}
  </SearchableSelectContent>
</SearchableSelect>
```

---

### 2. **ManageScheduleDialog** ✨
**Lokasi:** `src/components/schedules/ManageScheduleDialog.tsx`

**Yang Diupdate:**
- ✅ Select "Guru & Mata Pelajaran" → SearchableSelect
- ✅ Select "Ruangan" → SearchableSelect

**Benefit untuk User:**
- Admin tidak perlu scroll panjang untuk mencari guru
- Bisa langsung ketik nama guru atau mata pelajaran
- Pencarian ruangan berdasarkan kode atau nama ruangan
- Lebih efisien saat data guru/ruangan banyak

**Fitur Search:**
- Pencarian guru: berdasarkan **nama guru** atau **nama mata pelajaran**
- Pencarian ruangan: berdasarkan **kode ruangan** atau **nama ruangan**

**Contoh Use Case:**
> Admin ingin menambahkan jadwal untuk Guru "Ahmad" yang mengajar "Matematika". 
> Tanpa search: harus scroll mencari di antara 50+ guru
> Dengan search: ketik "ahmad" atau "matema" langsung muncul

---

### 3. **SchedulesPage** ⭐ **BARU!**
**Lokasi:** `src/app/dashboard/schedules/page.tsx`

**Yang Diupdate:**
- ✅ Select "Pilih Kelas" → SearchableSelect
- ✅ Select "Pilih Guru" → SearchableSelect
- ✅ Select "Pilih Ruangan" → SearchableSelect

**Benefit untuk User (Admin):**
- Admin bisa cepat navigasi ke kelas/guru/ruangan tertentu
- Tidak perlu scroll panjang di dropdown dengan 20+ kelas
- Search bekerja di 3 tab berbeda (Kelas, Guru, Ruangan)
- Filtering real-time untuk pengalaman yang smooth

**Fitur Search:**
- **Tab Kelas**: Pencarian berdasarkan **nama kelas** (misal: "XII TKJ", "TAV")
- **Tab Guru**: Pencarian berdasarkan **nama lengkap guru**
- **Tab Ruangan**: Pencarian berdasarkan **kode ruangan** atau **nama ruangan** (misal: "LAB", "A-201")

**Contoh Use Case:**
> Admin ingin melihat jadwal kelas "XII TKJ 1" diantara 30+ kelas yang ada.
> Tanpa search: scroll panjang di dropdown
> Dengan search: ketik "tkj 1" → kelas langsung muncul → klik → jadwal tampil

---

### 4. **LeavePermitForm** ✨
**Lokasi:** `src/components/leave/LeavePermitForm.tsx`

**Yang Diupdate:**
- ✅ Checkbox list "Pilih Anggota Kelompok" dengan search input

**Benefit untuk User (Siswa):**
- Siswa bisa mencari teman sekelas dengan cepat
- Tidak perlu scroll panjang di list checkbox
- Sangat berguna untuk kelas dengan banyak siswa (30-40 orang)

**Fitur Search:**
- Pencarian berdasarkan **nama lengkap siswa**
- Real-time filtering dengan debounce 300ms
- Tampilan "tidak ada teman yang ditemukan" jika pencarian kosong

**Contoh Use Case:**
> Siswa ingin membuat izin kelompok dengan 5 teman lainnya.
> Tanpa search: harus scroll mencari nama teman satu per satu di 35 siswa
> Dengan search: ketik nama teman, langsung muncul, centang, selesai

---

## 🛠 Technical Implementation

### Debounce Hook
Menggunakan custom hook `useDebounce` yang sudah ada di:
```
src/hooks/useDebounce.ts
```

**Fungsi:** Menunda eksekusi search hingga user berhenti mengetik selama 300ms untuk mengurangi re-render dan meningkatkan performa.

### State Management
Setiap form yang menggunakan searchable component memiliki:
1. **Search state** - menyimpan input user
2. **Debounced search** - nilai search setelah debounce
3. **Filtered data** - hasil filter berdasarkan search

### Filter Logic
```tsx
// Contoh: Filter assignments (Guru & Mata Pelajaran)
const filteredAssignments = formData?.assignments.filter((a: TeacherAssignment) => {
  const searchLower = assignmentSearch.toLowerCase()
  const teacherName = a.teacher.profile.full_name.toLowerCase()
  const subjectName = a.subject.subject_name.toLowerCase()
  return teacherName.includes(searchLower) || subjectName.includes(searchLower)
}) || []
```

---

## 📊 Performance Considerations

### ✅ Optimisasi yang Diterapkan:
1. **Debounce 300ms** - mencegah filter terlalu sering
2. **Lazy loading** - data hanya di-fetch ketika modal/form dibuka
3. **Conditional rendering** - search input hanya muncul di komponen yang membutuhkan
4. **Local filtering** - filter dilakukan di client-side (cepat untuk data <1000 items)

### 🚀 Performa Expected:
- Data < 100 items: Instant filtering
- Data 100-500 items: Smooth filtering dengan debounce
- Data > 500 items: Pertimbangkan server-side search (future enhancement)

---

## 🎨 UX Improvements

### Before ❌
- User harus scroll panjang untuk mencari item
- Tidak ada cara cepat untuk menemukan data spesifik
- Frustrating untuk data dengan 20+ items

### After ✅
- User bisa langsung search dengan mengetik
- Instant feedback dengan debounce
- "Tidak ada data" message yang jelas
- Smooth dan responsive

---

## 📝 Best Practices yang Diterapkan

1. **Konsistensi:** Semua searchable component menggunakan pattern yang sama
2. **Accessibility:** Input search tetap keyboard-navigable
3. **Error Handling:** Tampilan "tidak ada data" untuk hasil kosong
4. **Performance:** Debounce untuk mengurangi re-render
5. **Reusability:** Component dapat digunakan di berbagai form

---

## 🔮 Future Enhancements

### Potensial Improvements:
1. **Server-side search** untuk data yang sangat besar (>1000 items)
2. **Highlight matched text** di hasil pencarian
3. **Search history** untuk pencarian yang sering dilakukan
4. **Keyboard shortcuts** (Ctrl+F untuk langsung focus ke search)
5. **Advanced filters** (multiple criteria)

---

## 🧪 Testing Checklist

- [ ] Search input menerima input dengan benar
- [ ] Debounce bekerja (cek console untuk re-render)
- [ ] Filter menampilkan hasil yang benar
- [ ] "Tidak ada data" muncul ketika hasil kosong
- [ ] Select value tersimpan dengan benar setelah search
- [ ] Performance tetap smooth dengan data banyak
- [ ] Mobile responsive

---

## 👥 Area Implementasi

| Form/Dialog/Page | Field | Searchable? | Priority |
|------------------|-------|-------------|----------|
| **SchedulesPage** | **Pilih Kelas** | ✅ **Yes** | **High** |
| **SchedulesPage** | **Pilih Guru** | ✅ **Yes** | **High** |
| **SchedulesPage** | **Pilih Ruangan** | ✅ **Yes** | **High** |
| ManageScheduleDialog | Guru & Mata Pelajaran | ✅ Yes | High |
| ManageScheduleDialog | Ruangan | ✅ Yes | High |
| LeavePermitForm | Anggota Kelompok | ✅ Yes | High |
| UserForm | Roles | ❌ No | Low (data sedikit) |
| UserForm | Gender | ❌ No | Low (data sedikit) |
| UserForm | Status Kepegawaian | ❌ No | Low (data sedikit) |

---

## 💡 Tips untuk Developer

### Kapan Menggunakan SearchableSelect?
✅ **Gunakan jika:**
- Data lebih dari 10 items
- User sering mencari item spesifik
- Scrolling akan menyulitkan user

❌ **Tidak perlu jika:**
- Data kurang dari 5 items
- Semua option penting untuk dilihat
- Dropdown standard sudah cukup

### Implementasi Cepat:
1. Import SearchableSelect components
2. Buat state untuk search: `const [search, setSearch] = useState("")`
3. Buat filtered data berdasarkan search
4. Ganti `Select*` dengan `SearchableSelect*`
5. Tambahkan props: `searchable`, `searchPlaceholder`, `onSearchChange`

---

## 📞 Support

Jika ada pertanyaan atau issue terkait implementasi searchable select:
1. Cek dokumentasi ini terlebih dahulu
2. Lihat contoh implementasi di file yang sudah diupdate
3. Test di development environment sebelum deploy

---

**Last Updated:** 2 November 2025  
**Version:** 1.0.0  
**Author:** Development Team
