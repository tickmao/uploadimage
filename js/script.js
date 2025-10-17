/**
 * 图床上传 JS - Tickmao 最终整合版
 */

const droppable = document.querySelector(".droppable");
const list = document.querySelector(".list");
const ball = document.querySelector(".ball");
const hand = document.querySelector(".hand");

const formatBytes = (bytes, decimals = 2) => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + sizes[i];
};

let isDragging = 0;

// 全局拖拽事件
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

// GSAP 手球动画
const dragtl = gsap.timeline({ paused: true });
dragtl.to(ball, { duration: 0.4, translateX: "286px", autoAlpha: 1, translateY: "-230px" }, "drag")
      .to(hand, { duration: 0.4, transformOrigin: "right", rotate: "66deg", translateY: "70px", translateX: "-20px" }, "drag");

// list 拖拽效果
list.addEventListener("dragover", e => e.preventDefault());
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
  const { offsetX, offsetY } = e;
  const { files } = e.dataTransfer;
  if (!files || files.length === 0) return;
  const reader = new FileReader();
  reader.readAsDataURL(files[0]);
  reader.onload = () => itemMarkup(files[0], reader.result, offsetX, offsetY);
  droppable.classList.remove("is-over");
});

// 点击选择文件
var inputObj = document.getElementById("_ef");
list.onclick = function(e) {
  if (e.target.classList.contains("item-url")) return;
  inputObj.click();
};
inputObj.onchange = function() {
  const file = this.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.readAsDataURL(file);
  reader.onloadend = function(e) {
    itemMarkup(file, e.target.result, 50, 50);
  };
};

// 上传 & 渲染
function itemMarkup(file, url, x = 50, y = 50) {
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
    <button class="item-delete item-url" id="${id}iAjue" onclick="copyToClipboard(this)">复制</button>
  `;
  list.append(item);

  const itemDeleteBtn = item.querySelector(".item-delete");
  itemDeleteBtn.addEventListener("click", e => {
    e.stopPropagation();
    deleteItem(e);
  });

  // 进度动画
  const itemImage = item.querySelector(".item-img");
  const imageLeft = itemImage.offsetLeft;
  const imageTop = itemImage.offsetTop;
  const image = document.createElement("div");
  image.classList.add("loaded-image");
  image.innerHTML = `<img src="${url}"/><span></span>`;
  list.append(image);

  const tl = gsap.timeline({ onComplete: () => { image.remove(); itemImage.style.opacity = 1; list.scrollTo(0, list.scrollHeight); } });
  tl.set(image, { autoAlpha: 1, width: 20, height: 20, x: x - 10, y: y - 10, borderRadius: "50%" })
    .to(image, { duration: 0.3, width: 70, height: 70, x: x - 30, y: y - 30 })
    .to(image, { rotation: 720, duration: 1.2 })
    .to(image, { x: imageLeft, y: imageTop, duration: 0.8, width: 60, height: 48, borderRadius: 4 }, "-=0.5")
    .set(itemImage, { autoAlpha: 1 });

  // 上传文件
  ajax('update.php', file, function(data) {
    try {
      const res = JSON.parse(data);
      const btn = item.querySelector(".item-url");
      if (res.code === 0) {
        btn.setAttribute("data-url", res.msg);
        btn.classList.add("ready");
        showToast("上传成功，可点击复制链接");
      } else {
        showToast("上传失败：" + res.msg);
        item.remove();
      }
    } catch (err) {
      console.error("解析上传结果失败", data);
      showToast("服务器返回数据错误");
      item.remove();
    }
  });
}

// 删除文件
function deleteItem(e) {
  const parent = e.target.parentNode;
  const children = parent.querySelectorAll(":scope > *");
  const deletetl = gsap.timeline({
    onComplete: () => {
      parent.remove();
      if (!document.querySelector(".item")) dragtl.reverse();
    }
  });
  deletetl.to(children, { autoAlpha: 0, y: -10, duration: 0.2, stagger: 0.1 })
           .to(parent, { height: 0, paddingTop: 0, paddingBottom: 0, duration: 0.5 }, "-=.15");
}

// ajax 上传
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

// 复制按钮
function copyToClipboard(btn) {
  const text = btn.getAttribute('data-url');
  if (!btn.classList.contains("ready") || !text) {
    showToast("图片正在上传或链接未生成");
    return;
  }
  const textArea = document.createElement("textarea");
  textArea.value = text;
  document.body.appendChild(textArea);
  textArea.select();
  try {
    document.execCommand('copy');
    showToast("✅ 图片链接已复制到剪贴板");
  } catch (err) {
    showToast("❌ 复制失败，请手动复制");
  }
  document.body.removeChild(textArea);
}

// toast 提示
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
