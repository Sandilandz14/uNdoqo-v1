const books = [
    { title: "Imibengo", author: "WG Bennie", format: "PDF", price: "R400", img: "imibengo-WG-Bennie.png"},
    { title: "Olden times in Zululand", author:"AT Bryant", format:"PDF", price:"R4000", img:"olden-times.png"},
  { title: "Intlalo kaXhosa", author: "Tiyo Soga", format: "PDF", price: "R500", img: "intlalo.png"},
  { title: "The Record", author: "Moodie", format: "PDF", price: "R400", img: "the-record.jpg"},
  { title: "South Eastern Bantu", author: "JH Soga", format: "PDF", price: "R350", img: "south-eastern-bantu.jpg"},
  { title: "Battle at Mamusa",author: "Piet Erasmus", format: "PDF", price: "R250", img: "battle-at-mamusa.jpg"},
  { title: "History of Basuto",author:"DF Ellenberger",format:"PDF", price:"R350", img:"basuto-ellenberger.png"},
 { title: "Sonqua", author: "Pieter Jolly",format: "PDF", price: "R350", img:"sonqua.png"},
 { title: "History & Ethnography of Africa south of Zambezi before 1795", author: "GM Theal", format:"PDF", price:"R500", img:"before-1795.png"},
 { title: "The Zulu People As They Were...", author:"AT Bryant", format:"PDF", price:"R250", img:"zulu-before-white-man.png"},
 { title: "Knowledge & Colonialism: 18th Century travellers in SA", author: "Brill", format:"PDF", price:"R400", img:"knowledge-colonialism.png"},
 { title: "The Wrongs of the Caffre Nation: A Narrative",author: "Jusrus", format:"PDF", price:"R350", img:"wrongs-of-the-caffre.png"},
 { title: "Myths and Legends of the Bantu", author: "Alice Werner", format: "PDF", price:"R250", img:"myths-legends.png"},
 { title: "Memoir respecting the Ntu, Khoe and !Kwi of South Africa", author: "Lieut-Col. Sutherland", format:"PDF", price:"R400", img:"ntu-khwe-kwi.png"},
 { title: "The Native Races of South Africa", author: "Stow & Theal", format:"PDF", price:"R400", img:"native-races.png"}
];

function renderBooks(filter = "All") {
  const container = document.getElementById("book-grid");
  const filtered = filter === "All" ? books : books.filter(b => b.author === filter);
  
  container.innerHTML = filtered.map(book => `
    <article class="book-card">
    <img src="../assets/images/bookstore-images/${book.img}" alt="${book.title}" style="width:100%; height:auto; border-radius: 4px;">
      <h3>${book.title}</h3>
      <p>Author: ${book.author}</p>
      <div class="price-tag">${book.price} | ${book.format}</div>
      <button class="btn btn-primary" onclick="alert('Added ${book.title} to cart')">Add to Cart</button>
    </article>
  `).join('');
}

function filterBooks() {
  const author = document.getElementById("author-filter").value;
  renderBooks(author);
}

document.addEventListener("DOMContentLoaded", () => {
  const filter = document.getElementById("author-filter");
  const authors = [...new Set(books.map(b => b.author))];
  
  authors.forEach(a => {
    const opt = document.createElement("option");
    opt.value = a;
    opt.textContent = a;
    filter.appendChild(opt);
  });
  
  renderBooks();
});