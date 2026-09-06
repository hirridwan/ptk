window.CLASS_ROSTERS={
X5:['Agfar Maulana Ramadhan (agfar)','Aghniya Maulany','Agita Ramadani','Ahmad Nur Hidayat','Aileen Azkani Pradita','Aletha Zafirahdewi','Ammar Padhilah','Arfah Crianca Tudikromo','Assyifa Khalida Zia','Athalla Meccawinata Ilyas','Az Zahwa Dzarfa Hafidza','Azka Faiz Ardanaputra','Bilqis Alfiyah Kamiliya','Daffa Fadli Putradihan','Dirga Manggala Mahardika','Dzaky Hafizh Rabbani','Fifi Zahra Danica','Fikri Refaldy Ramadhan','Fiona Kayyisha Widyatmoko','Gizzele Gracia Huliselan','Haikal Azhar','Iman Destianto','Intan Maysa Nurhasanah','Maliq Agasha Setiawan','Muhammad Arkhan Munabih Zain','Muhammad Fikry Burhan Hasyir','Muhammad Ghifary Gani Nurhayat','Muhammad Reffinza Arya Rumawan','Nadhifah Razwa As Saudah','Naila Arinda Putri','Nur Agni Salsabila','Nur Insani Sofyan','Nurul Fitri Septiani','Rahma Vania Bella Aruna','Raina Ratna Kinasih','Rania Putri Alifya Anwari','Rashad Bagas Chalidi','Regisha Muhammad Rashif Rustendi','Salsabila Afifah','Syafa Anindya Putri','Tsani Malika Anjana','Untsa Dhiya Azmah Urfa','Zanu Emildan','Zhafira Meilany Alifa Putri'],
X8:['Abyasa Dmitri Yuandafa','Alif Arkhan Zulfadli','Almira Zahidah Hardiansyah','Alya Putri Wachjudin','Amira','Ananta Fathur Rahman','Ardinov Adiarya Yusdisio','Arga Maulana Yusuf','Aziz Rizky Nurtian','Chenzira Marsya Rasyiqa','Clarissa Kania Putri','Daurellino Ferrovizal Putra','Davien Gemello Taufik','Djalu Damar Prawira','Fakhri Alamsyah Lubis','Firdansyah Ahwaz Chandra Al Kautsar','Gavin Abdul Fariq Zakaria','Gustian Ramadani','Jidan Dwi Permana','Keira Adzani Suci Maharani','Khairan Muhammad Aska','Kirana Aqila Naphesa Ayu','Lathifah Nur Laila','Muhammad Alby Gail Al Rasheed','Muhammad Fadhil Hakim','Muhammad Fathan Arifky','Muhammad Mughny Al-Mubarok','Muhammad Rakana Ridzky','Najla Wadhha Hanifah','Nasywa Zahra Maula Hanifatu Daniah','Nayumi Aurola Putri Hendrayana','Queneisha Zahira Sakhi','Raqiqa Qairin Annum','Shafa Amira Sriputri Rochmana','Shafiqa Althia Putri','Shavira Chantika Azzahra Rahmat','Sofia Aisha Azaria','Soka Kinasi Jagat Raya','Syahla Nada Aurina','Syifa Rahmalia Shadiqin','Thariq Tamam','Tubagus Baraa` Shaabir Muzhaffar','Vanya Ruqayyah Dalimunthe','Zaza Dwi Alina Rahman'],
X11:['Abdur Ra`Uf Amin','Ahmad Saiful Islam','Alhafizh Sanjaya Putra','Alzena Rasyiqah Hafsa Gunawan','Angga Saputra','Ashya Anditha Maharani','Athallah Dzaky Syawal','Auliya Khairunnisa','Axelia Kinanti Ashaningtyas','Azka Muhamad Narendra','Azura Dannisa','Careena Rameyza Almira','Citra Permatasari','Diandra Raditya','Fatih Maulidan Nafiis Nugraha','Firzalyqa Dwingga Anindiarahmad','Gendis Ayu Larasati','Ghailan Ikmal Maggakashka','Ibrahim Augie Adila','Januar Arrahman','Lintang Khaulani Iqnie','Mahib Alldzaka','Maiza Ailani Wijaya','Malikha Aura Liyana','Mochamad Rakha Adiguna Sopian','Muhammad Alvino Raditya','Muhammad Fadhlan Nugraha','Nadia Aprilia','Natly Aluna Putri','Naufal Arkan Munggaran','Naura Nasuha','Niarty Dwi Fatwa','Nizam Fakhri Fadhillah','Nu`Man Putra Setiana','Putri Fatimah Zahira Nurcahyo','Rahayu Vinata','Regina Puteri','Regina Syarifudin','Ridha Safania Hasna','Rizki Arif Al Amin','Shopia Putri Permana','Vera Desiyanti','Zahira Cinta Putri Hidayat','Zhelfan Verdy Arvalent']
};

window.CLASS_INFO={
  X5:{className:'X-5',teacher:'Fauziah Anwar'},
  X8:{className:'X-8',teacher:'Ridwan Maulana'},
  X11:{className:'X-11',teacher:'Ismu Kamal Muhiban'}
};

Object.keys(CLASS_ROSTERS).forEach(k=>{
  CLASS_ROSTERS[k]=CLASS_ROSTERS[k].map((name,i)=>({
    code:`${k}-${String(i+1).padStart(2,'0')}`,
    name,
    class:CLASS_INFO[k].className,
    teacher:CLASS_INFO[k].teacher
  }));
});