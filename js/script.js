/**
 * 阿里图床上传
 * @author: Tickmao
 * @version: 1.3 (Tickmao 修复版)
 */

const droppable = document.querySelector(".droppable");
const list = document.querySelector(".list");
const ball = document.querySelector(".ball");
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
dragtl
  .to(ball, { duration: 0.4, translateX: "286px", autoAlpha: 1, translateY: "-230px" }, "drag")
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

  // 上传文件
  ajax('update.php', file, function(data) {
    data = JSON.parse(data);
    const itemurlBtn = item.querySelector(".item-url");
    if (data.code == 0) {
      itemurlBtn.setAttribute('data-url', data.msg);
      itemurlBtn.classList.add("ready"); // ✅ 标记上传完成
    } else {
      showToast(data.msg);
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
  deletetl
    .to(children, { autoAlpha: 0, y: -10, duration: 0.2, stagger: 0.1 })
    .to(parent, { height: 0, paddingTop: 0, paddingBottom: 0, duration: 0.5 }, "-=.15");
};

var inputObj = document.getElementById("_ef");
list.onclick = function(e) {
  // ✅ 避免点击复制按钮触发选择文件
  if (e.target.classList.contains("item-url")) return;
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
    if (xhr.readyState === 4 && xhr.status === 200) fn(xhr.responseText);
  };
  const formData = new FormData();
  formData.append('file', data);
  xhr.open("post", url, true);
  xhr.send(formData);
}

// ✅ 新版复制逻辑 + 状态提示
function copyToClipboard(btn) {
  const text = btn.getAttribute('data-url');
  if (!btn.classList.contains("ready")) {
    showToast("图片正在上传中，请稍后再试");
    return;
  }
  if (!text) {
    showToast("未找到上传链接");
    return;
  }

  const textArea = document.createElement("textarea");
  textArea.value = text;
  document.body.appendChild(textArea);
  textArea.select();

  try {
    document.execCommand('copy');
    showToast("✅ 链接已复制到剪贴板");
  } catch (err) {
    showToast("❌ 浏览器不支持复制");
  }

  document.body.removeChild(textArea);
}

// ✅ 轻量 toast 提示
function showToast(msg) {
  const toast = document.createElement("div");
  toast.textContent = msg;
  toast.style.position = "fixed";
  toast.style.bottom = "20px";
  toast.style.left = "50%";
  toast.style.transform = "translateX(-50%)";
  toast.style.background = "rgba(0,0,0,0.7)";
  toast.style.color = "#fff";
  toast.style.padding = "8px 16px";
  toast.style.borderRadius = "6px";
  toast.style.fontSize = "14px";
  toast.style.zIndex = "9999";
  toast.style.opacity = "0";
  toast.style.transition = "opacity 0.3s ease";
  document.body.appendChild(toast);

  setTimeout(() => (toast.style.opacity = "1"), 50);
  setTimeout(() => {
    toast.style.opacity = "0";
    setTimeout(() => toast.remove(), 500);
  }, 2000);
}
