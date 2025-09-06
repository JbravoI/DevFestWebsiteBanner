

// Text Field, File field, Banner Preview, Download button.
const textInput = document.getElementById('location');
const fileInput = document.getElementById('file-upload');
const bannerPreviewBlue = document.getElementById('banner-preview-blue');
const bannerPreviewYellow = document.getElementById('banner-preview-yellow');
const downloadBtn = document.getElementById('download-btn');

let bannerConfig = {};

// Load bannerConfig from JSON file (no fallback)
fetch('files/bannerConfig.json')
  .then(res => res.json())
  .then(config => {
    bannerConfig = config;
     renderBannerPreview();
  })
  .catch(() => {
    alert('Could not load bannerConfig.json. Using defaults.');
  });

// Set canvas size for banner blue template
bannerPreviewBlue.width = bannerConfig.banner_blue.img_w;
bannerPreviewBlue.height = bannerConfig.banner_blue.img_h;

// Set canvas size for banner yellow template
bannerPreviewYellow.width = bannerConfig.banner_yellow.img_w;
bannerPreviewYellow.height = bannerConfig.banner_yellow.img_h;

// Show banner template image on page load
window.addEventListener('DOMContentLoaded', () => {
  const ctx = bannerPreviewBlue
.getContext('2d');
  const img = new Image();
  img.onload = function() {
    ctx.clearRect(0, 0, bannerPreviewBlue
    .width, bannerPreviewBlue
    .height);
    ctx.drawImage(img, 0, 0, bannerPreviewBlue
    .width, bannerPreviewBlue
    .height);
  };
  img.src = 'images/banner/blue_banner_sample.png';
});

// Show banner template image on page load
window.addEventListener('DOMContentLoaded', () => {
  const ctx = bannerPreviewYellow
.getContext('2d');
  const img = new Image();
  img.onload = function() {
    ctx.clearRect(0, 0, bannerPreviewYellow
    .width, bannerPreviewYellow
    .height);
    ctx.drawImage(img, 0, 0, bannerPreviewYellow
    .width, bannerPreviewYellow
    .height);
  };
  img.src = 'images/banner/yellow_banner_sample.png';
});

// File upload handler
fileInput.addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  try {
    attendeeList = await window.parseAttendeeFile(file);
    if (!attendeeList.length) throw new Error('No attendees found');
    document.getElementById('countSpan').textContent = attendeeList.length;
    document.getElementById('banner-count-label').textContent = `${attendeeList.length} banner${attendeeList.length === 1 ? '' : 's'} loaded`;
    // Generate and display banner for the first attendee
    renderBadgePreview(attendeeList[0]);
    downloadBtn.disabled = false;
  } catch (err) {
    alert('Error parsing file: ' + err);
    document.getElementById('banner-count-label').textContent = '';
  }
});

// Render banner preview for first attendee
function renderBadgePreview(attendee) {
  const ctx = bannerPreviewBlue
.getContext('2d');
  let type = (attendee && attendee.participationType) ? attendee.participationType.toLowerCase() : 'general';
  let imgSrc = `images/banner/${type}.png`;
  const img = new Image();
  img.onload = function() {
    ctx.clearRect(0, 0, bannerPreviewBlue
    .width, bannerPreviewBlue
    .height);
    ctx.drawImage(img, 0, 0, bannerPreviewBlue
    .width, bannerPreviewBlue
    .height);
    if (attendee) {
      Object.keys(bannerConfig).forEach(key => {
        const conf = bannerConfig[key];
        ctx.font = `${conf.fontsize}px ${conf.fontfamily}`;
        ctx.textAlign = conf.align;
        ctx.textBaseline = 'middle'; // Vertically center text
        ctx.fillStyle = '#222';
        // For left alignment, use x as is; for center, x + w/2
        let xPos = conf.x;
        if (conf.align === 'center') xPos = conf.x + conf.w/2;
        ctx.fillText(attendee[key] || '', xPos, conf.y + conf.h/2);
      });
    }
  };
  img.onerror = function() {
    if (imgSrc !== 'images/banner/banner.png') {
      img.src = 'images/banner/banner.png';
    }
  };
  img.src = imgSrc;
}

// Download all banners as ZIP
// TODO: Implement banner generation for all attendees and ZIP packaging
// Load JSZip from CDN
if (!window.JSZip) {
  const jszipScript = document.createElement('script');
  jszipScript.src = 'https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js';
  document.head.appendChild(jszipScript);
}
downloadBtn.addEventListener('click', async () => {
  if (!window.JSZip) {
    alert('JSZip not loaded yet. Try again in a moment.');
    return;
  }
  const zip = new JSZip();
  // Create a hidden canvas for rendering each banner
  const tempCanvas = document.createElement('canvas');
  tempCanvas.width = bannerPreviewBlue
.width;
  tempCanvas.height = bannerPreviewBlue
.height;
  const tempCtx = tempCanvas.getContext('2d');
  for (let i = 0; i < attendeeList.length; i++) {
    const attendee = attendeeList[i];
    let type = (attendee && attendee.participationType) ? attendee.participationType.toLowerCase() : 'general';
    let imgSrc = `images/banner/${type}.png`;
    // Render banner for each attendee
    await new Promise((resolve) => {
      const img = new Image();
      img.onload = function() {
        tempCtx.clearRect(0, 0, tempCanvas.width, tempCanvas.height);
        tempCtx.drawImage(img, 0, 0, tempCanvas.width, tempCanvas.height);
        Object.keys(bannerConfig).forEach(key => {
          const conf = bannerConfig[key];
          tempCtx.font = `${conf.fontsize}px ${conf.fontfamily}`;
          tempCtx.textAlign = conf.align;
          tempCtx.textBaseline = 'middle';
          tempCtx.fillStyle = '#222';
          let xPos = conf.x;
          if (conf.align === 'center') xPos = conf.x + conf.w/2;
          tempCtx.fillText(attendee[key] || '', xPos, conf.y + conf.h/2);
        });
        const dataUrl = tempCanvas.toDataURL('image/png');
        zip.file(`banner_${i+1}_${attendee.firstname}_${attendee.lastname}.png`, dataUrl.split(',')[1], {base64: true});
        resolve();
      };
      img.onerror = function() {
        if (imgSrc !== 'images/banner/banner.png') {
          img.src = 'images/banner/banner.png';
        } else {
          resolve();
        }
      };
      img.src = imgSrc;
    });
  }
  const content = await zip.generateAsync({type: 'blob'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(content);
  a.download = 'devfest_banners.zip';
  a.click();
});

// Toggle footer content visibility
document.getElementById('footer-toggle').addEventListener('click', function() {
  const content = document.getElementById('footer-content');
  if (content.style.display === 'none' || content.style.display === '') {
    content.style.display = 'flex';
  } else {
    content.style.display = 'none';
  }
});

// TODO: Add theme detection and UI adaptation
