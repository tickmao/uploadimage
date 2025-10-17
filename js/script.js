/**
 * 阿里图床上传
 * @author: 学习
 * @link: https://tickmao.com
 * @version: 1.2 (Tickmao 修复版)
**/

const droppable = document.querySelector(".droppable");
const list = document.querySelector(".list");
const ball = document.querySelector(".ball");
const filledBall = document.querySelector(".filled-ball");
const hand = document.querySelector(".hand");
const reader = new FileReader();

const formatBytes = (bytes, decimals = 2) => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + sizes[i];
};

let isDragging = 0;
document.addEventListener("dragover", e => {
  e.preventDefault();
  isDragging++;
  if (isDragging === 1) droppable.classList.add("is-dragging");
});
document.addEventListener("drop", e => {
  e.preventDefault();
  isDragging = 0;
  droppable.classList.remove("is-dragging");
});

list.addEventListener("dragover", e => e.preventDefault());

const dragtl = gsap.timeline({ paused: true });
dragtl.to(ball, { duration: 0.4, translateX: "286px", autoAlpha: 1, translateY: "-230px" }, "drag")
      .to(hand, { duration: 0.4, transformOrigin: "right", rotate: "66deg", translateY: "70px", translateX: "-20px" }, "drag");

list.addEventListener("dragenter", e => {
  e.preventDefault();
  droppable.classList.add("is-over");
  dragtl.play();
});
list.addEventListener("dragleave", e => {
  e.preventDefault();
  droppable.classList.remove("is-over");
  dragtl.reverse();
});

list.addEventListener("drop", e => {
  e.preventDefault();
  let sadly = 0;
  const { offsetX, offsetY } = e;
  const { files } = e.dataTransfer;
  reader.readAsDataURL(files[0]);
  reader.addEventListener("load", () => {
    sadly++;
    if (sadly > 1) return;
    itemMarkup(files[0], reader.result, offsetX, offsetY);
  });
  droppable.classList.remove("is-over");
});

const itemMarkup = (file, url, x, y) => {
  const item = document.createElement("div");
  const id = Math.random().toString(36).substr(2, 9);
  item.classList.add("item");
  item.setAttribute("id", id);

  item.innerHTML = `
    <div class="item-img"><img src="${url}"/></div>
    <div class="item-details">
      <div class="item-name">${file.name}</div>
      <div class="item-size">SIZE:${formatBytes(file.size)}</div>
    </div>
    <button class="item-delete" data-id="${id}"></button>
    <button class="item-delete item-url" id="${id}iAjue" onclick="copyToClipboard(this)">
      复制
    </button>
  `;
  list.append(item);

  const itemDeleteBtn = item.querySelector(".item-delete");
  itemDeleteBtn.addEventListener("click", e => {
    e.stopPropagation();
    deleteItem(e);
  });

  const itemImage = item.querySelector(".item-img");
  const imageLeft = itemImage.offsetLeft;
  const imageTop = itemImage.offsetTop;
  const image = document.createElement("div");
  image.classList.add("loaded-image");
  image.innerHTML = `
    <img src="${url}"/>
    <span>
      <svg fill="#fff" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 330 330">
        <path d="M165 7.5c-8.284 0-15 6.716-15 15v60c0 8.284 6.716 15 15 15
        8.284 0 15-6.716 15-15v-60c0-8.284-6.716-15-15-15z"/>
        <path d="M165 262.5c-8.284 0-15 6.716-15 15v30c0 8.284 6.716 15
        15 15 8.284 0 15-6.716 15-15v-30c0-8.284-6.716-15-15-15z"/>
      </svg>
    </span>`;
  list.append(image);

  ajax('update.php', file, function(data) {
    data = JSON.parse(data);
    if (data.code == 0) {
      const itemurlBtn = item.querySelector(".item-url");
      itemurlBtn.setAttribute('data-url', data.msg);
      itemurlBtn.addEventListener('click', function(e) {
        e.stopImmediatePropagation(); // ✅ 防止触发 list.onclick
      });
    } else {
      alert(data.msg);
      item.querySelector(".item-delete").click();
    }
  });
};

const deleteItem = e => {
  const parent = e.target.parentNode;
  const children = parent.querySelectorAll(":scope > *");
  const deletetl = gsap.timeline({
    onComplete: () => {
      parent.remove();
      const item = document.querySelector(".item");
      if (!item) dragtl.reverse();
    }
  });
  deletetl.to(children, { autoAlpha: 0, y: -10, duration: 0.2, stagger: 0.1 })
          .to(parent, { height: 0, paddingTop: 0, paddingBottom: 0, duration: 0.5 }, "-=.15");
};

var inputObj = document.getElementById("_ef");
list.onclick = function() {
  inputObj.click();
};

inputObj.onchange = function() {
  var file = this.files[0];
  if (window.FileReader) {
    var reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onloadend = function(e) {
      itemMarkup(file, e.target.result, 50, 50);
    };
  }
};

function ajax(url, data, fn) {
  const xhr = new XMLHttpRequest();
  xhr.onreadystatechange = function() {
    if (xhr.readyState === 4 && xhr.status === 200) {
      fn(xhr.responseText);
    }
  };
  const formData = new FormData();
  formData.append('file', data);
  xhr.open("post", url, true);
  xhr.send(formData);
}

function copyToClipboard(btn) {
  const text = btn.getAttribute('data-url');
  const textArea = document.createElement("textarea");
  textArea.value = text;
  textArea.style.position = 'fixed';
  textArea.style.opacity = '0';
  document.body.appendChild(textArea);
  textArea.select();
  try {
    document.execCommand('copy');
    alert('链接已复制到剪贴板');
  } catch (err) {
    alert('该浏览器不支持点击复制到剪贴板');
  }
  document.body.removeChild(textArea);
}
