document.addEventListener('DOMContentLoaded', () => {
  const modal = document.getElementById('comingModal');
  const modalTitle = document.getElementById('comingTitle');
  const modalText = document.getElementById('comingText');
  const closeBtn = document.getElementById('closeModal');
  const triggers = document.querySelectorAll('[data-coming]');
  const toast = document.getElementById('copyToast');

  const defaultTitle = 'العدد القادم قادم';
  const defaultText = 'هذا الباب محفوظ حالياً لحين صدور العدد الأول.';

  function openModal(title = defaultTitle, text = defaultText) {
    if (!modal || !modalTitle || !modalText) return;
    modalTitle.textContent = title;
    modalText.textContent = text;
    modal.classList.add('show');
    document.body.style.overflow = 'hidden';
  }

  function closeModal() {
    if (!modal) return;
    modal.classList.remove('show');
    document.body.style.overflow = '';
  }

  triggers.forEach((item) => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      const title = item.getAttribute('data-title') || defaultTitle;
      const text = item.getAttribute('data-text') || defaultText;
      openModal(title, text);
    });
  });

  if (closeBtn) {
    closeBtn.addEventListener('click', closeModal);
  }

  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal();
    });
  }

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeModal();
  });

  function showToast(message) {
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 1800);
  }

  /* Article toggles */
  const toggleButtons = document.querySelectorAll('.story-toggle-btn');
  toggleButtons.forEach((button) => {
    const article = button.closest('.story-card');
    const body = article ? article.querySelector('.story-body') : null;
    if (!body) return;

    button.addEventListener('click', () => {
      const collapsed = body.classList.contains('is-collapsed');
      body.classList.toggle('is-collapsed');
      button.classList.toggle('is-open');

      if (!collapsed) {
        article.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

  /* Copy buttons */
  const copyButtons = document.querySelectorAll('.copy-btn');
  copyButtons.forEach((button) => {
    button.addEventListener('click', async () => {
      const article = button.closest('.story-card');
      if (!article) return;
      const title = article.querySelector('.story-title')?.innerText?.trim() || '';
      const meta = article.querySelector('.story-meta')?.innerText?.trim() || '';
      const body = article.querySelector('.story-body')?.innerText?.trim() || '';
      const fullText = `${title}\n${meta}\n\n${body}`;

      try {
        await navigator.clipboard.writeText(fullText);
        button.classList.add('copied');
        button.textContent = 'تم النسخ';
        showToast('تم نسخ المقال. استخدمه بحذر.');
        setTimeout(() => {
          button.classList.remove('copied');
          button.textContent = 'انسخ المقال';
        }, 1800);
      } catch {
        showToast('تعذّر النسخ حالياً.');
      }
    });
    
  });
  /* Copy phone buttons */
  const phoneButtons = document.querySelectorAll('.copy-phone-btn');
  phoneButtons.forEach((button) => {
    button.addEventListener('click', async () => {
      const phone = button.dataset.phone || button.textContent.trim();

      try {
        await navigator.clipboard.writeText(phone);
        const oldText = button.textContent;
        button.classList.add('copied');
        button.textContent = 'تم نسخ الرقم';
        showToast('تم نسخ الرقم.');
        setTimeout(() => {
          button.classList.remove('copied');
          button.textContent = oldText;
        }, 1600);
      } catch {
        showToast('تعذّر نسخ الرقم حالياً.');
      }
    });
  });
  /* Entertainment page */
  if (document.body.dataset.page === 'entertainment') {
    const birthdayModal = document.getElementById('birthdayModal');
    const birthdayForm = document.getElementById('birthdayForm');
    const aprilModal = document.getElementById('aprilModal');
    const closeAprilModal = document.getElementById('closeAprilModal');
    const zodiacName = document.getElementById('zodiacName');
    const zodiacText = document.getElementById('zodiacText');

    const zodiacPredictions = {
      'الحمل': 'ستبدأ شيئاً هذا الشهر دون حاجة حقيقية لانتظار موافقة داخلية أو خارجية. وتعتبر ذلك منطقياً.',
      'الثور': 'لن تغيّر رأيك بسهولة، وسيُحسب لك هذا مرة على أنه ثبات… ومرة على أنه نفس الشيء.',
      'الجوزاء': 'ستقول فكرتين متناقضتين بنفس الثقة، وتعتبر المشكلة عند من لاحظ التناقض لا عندك.',
      'السرطان': 'هناك شيء تشعر به. لا حاجة لتسميته الآن. لكن من المهم أن يعرف الجميع أنك تشعر به.',
      'الأسد': 'ستدخل المكان، ثم تساعد المكان على ملاحظة أنك دخلت.',
      'العذراء': 'ستكتشف خطأ لم يلاحظه أحد، ثم تعتبر عدم ملاحظتهم له خطأ إضافياً.',
      'الميزان': 'سيُطلب منك قرار واضح، وستنجح في إنتاج تردد أنيق يرضي الجميع مؤقتاً.',
      'العقرب': 'أنت لا تحتاج إلى معرفة كل شيء. لكنك ستعرفه، وعلى الأرجح بصمت غير مريح.',
      'القوس': 'ستتحمس لفكرة بسرعة، ثم تفاجأ بأنها تحتاج استمرارية، وهو طلب غير لطيف منها.',
      'الجدي': 'سيستمر كل شيء كما خططت له، وهذا يزعجك قليلاً لأنك كنت تفضّل مفاجأة… ضمن الخطة.',
      'الدلو': 'فكرة ممتازة، توقيت غير مفهوم، شرح أطول من اللازم، وإعجاب ذاتي مبرر جزئياً.',
      'الحوت': 'قد لا يحدث شيء فعلي هذا الشهر، لكن تجربتك الداخلية ستكون غنية بما يكفي لتشعر أن شيئاً كبيراً حدث.'
    };

    function getZodiac(day, month) {
      if ((month === 3 && day >= 21) || (month === 4 && day <= 19)) return 'الحمل';
      if ((month === 4 && day >= 20) || (month === 5 && day <= 20)) return 'الثور';
      if ((month === 5 && day >= 21) || (month === 6 && day <= 20)) return 'الجوزاء';
      if ((month === 6 && day >= 21) || (month === 7 && day <= 22)) return 'السرطان';
      if ((month === 7 && day >= 23) || (month === 8 && day <= 22)) return 'الأسد';
      if ((month === 8 && day >= 23) || (month === 9 && day <= 22)) return 'العذراء';
      if ((month === 9 && day >= 23) || (month === 10 && day <= 22)) return 'الميزان';
      if ((month === 10 && day >= 23) || (month === 11 && day <= 21)) return 'العقرب';
      if ((month === 11 && day >= 22) || (month === 12 && day <= 21)) return 'القوس';
      if ((month === 12 && day >= 22) || (month === 1 && day <= 19)) return 'الجدي';
      if ((month === 1 && day >= 20) || (month === 2 && day <= 18)) return 'الدلو';
      return 'الحوت';
    }

    if (birthdayForm) {
      birthdayForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const day = Number(document.getElementById('birthDay').value);
        const month = Number(document.getElementById('birthMonth').value);
        const year = Number(document.getElementById('birthYear').value);

        if (!day || !month || !year) {
          showToast('أكمل التاريخ أولاً.');
          return;
        }

        if (day < 1 || day > 31 || month < 1 || month > 12 || year < 1900 || year > 2100) {
          showToast('أدخل تاريخاً معقولاً ثم تابع.');
          return;
        }

        const zodiac = getZodiac(day, month);
        if (zodiacName && zodiacText) {
          zodiacName.textContent = zodiac;
          zodiacText.textContent = zodiacPredictions[zodiac];
        }

        if (birthdayModal) birthdayModal.classList.remove('show');

        if (month === 4) {
          if (aprilModal) {
            aprilModal.classList.add('show');
            document.body.style.overflow = 'hidden';
          }
        } else {
          document.body.style.overflow = '';
        }
      });
    }

    if (closeAprilModal && aprilModal) {
      closeAprilModal.addEventListener('click', () => {
        aprilModal.classList.remove('show');
        document.body.style.overflow = '';
      });
    }

    if (aprilModal) {
      aprilModal.addEventListener('click', (e) => {
        if (e.target === aprilModal) {
          aprilModal.classList.remove('show');
          document.body.style.overflow = '';
        }
      });
    }

    /* Coin */
    const flipCoinBtn = document.getElementById('flipCoinBtn');
    const coin = document.getElementById('coin');
    const coinResult = document.getElementById('coinResult');

    if (flipCoinBtn && coin && coinResult) {
      flipCoinBtn.addEventListener('click', () => {
        coin.classList.toggle('flipped');
        coinResult.textContent = 'النتيجة النهائية بعد مراجعة الوجهين: خرا';
      });
    }

    /* Quiz */
    const quizForm = document.getElementById('quizForm');
    const quizResult = document.getElementById('quizResult');

    if (quizForm && quizResult) {
      quizForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const data = new FormData(quizForm);
        let scoreA = 0, scoreB = 0, scoreC = 0, scoreD = 0;

        for (const [, value] of data.entries()) {
          if (value === 'a') scoreA++;
          if (value === 'b') scoreB++;
          if (value === 'c') scoreC++;
          if (value === 'd') scoreD++;
        }

        let resultText = 'أنت حالة انتقالية غير معرّفة، وهذا بحد ذاته إنجاز.';
        if (scoreA >= scoreB && scoreA >= scoreC && scoreA >= scoreD) {
          resultText = 'أنت من جماعة التحليل المحترم: لا تهرب من المشكلة، فقط تشرحها حتى تفقد شكلها الأصلي.';
        } else if (scoreB >= scoreA && scoreB >= scoreC && scoreB >= scoreD) {
          resultText = 'أنت من أهل السرد: حتى حين تكون الحقيقة واضحة، تفضّل أن تصل بعد أربع مقدمات وثلاث ملاحظات جانبية.';
        } else if (scoreC >= scoreA && scoreC >= scoreB && scoreC >= scoreD) {
          resultText = 'أنت من فئة الإشارة والتلميح والقراءة بين السطور. وهذا جميل نظرياً، لكنه مرهق لكل من حولك عملياً.';
        } else if (scoreD >= scoreA && scoreD >= scoreB && scoreD >= scoreC) {
          resultText = 'أنت من جماعة التأجيل الناضج: لا تنكر المشكلة، فقط تمنحها وقتاً كافياً لتغيّر اسمها.';
        }

        quizResult.textContent = resultText;
        quizResult.classList.add('show-result');
      });
    }

    /* Real crossword */
    const crosswordBoard = document.getElementById('crosswordBoard');
    const checkCrosswordBtn = document.getElementById('checkCrosswordBtn');
    const crosswordResult = document.getElementById('crosswordResult');

    const gridSize = 12;

    const placements = [
      { number: 1, word: 'الوعي', clueType: 'across', row: 0, col: 0 },
      { number: 2, word: 'غريب', clueType: 'across', row: 0, col: 7 },
      { number: 3, word: 'صمت', clueType: 'across', row: 3, col: 8 },
      { number: 4, word: 'منوعات', clueType: 'across', row: 5, col: 3 },
      { number: 5, word: 'حباب', clueType: 'across', row: 10, col: 0 },
      { number: 6, word: 'سلام', clueType: 'across', row: 10, col: 6 },

      { number: 7, word: 'التنوير', clueType: 'down', row: 2, col: 4 },
      { number: 8, word: 'القمر', clueType: 'down', row: 5, col: 7 },
      { number: 9, word: 'مشكلة', clueType: 'down', row: 5, col: 3 },
      { number: 10, word: 'التدخين', clueType: 'down', row: 1, col: 10 },
      { number: 11, word: 'طاقة', clueType: 'down', row: 7, col: 0 },
      { number: 12, word: 'اشارة', clueType: 'down', row: 4, col: 1 }
    ];

    function normalizeArabic(str) {
      return str
        .replace(/\s+/g, '')
        .replace(/أ|إ|آ/g, 'ا')
        .replace(/ة/g, 'ة')
        .replace(/ى/g, 'ي');
    }

    const solution = Array.from({ length: gridSize }, () => Array(gridSize).fill(''));
    const numberMap = {};

    placements.forEach((item) => {
      const chars = [...item.word];
      chars.forEach((char, index) => {
        const row = item.row + (item.clueType === 'down' ? index : 0);
        const col = item.col + (item.clueType === 'across' ? index : 0);
        solution[row][col] = char;
      });

      numberMap[`${item.row}-${item.col}`] = item.number;
    });

    if (crosswordBoard) {
      crosswordBoard.style.setProperty('--grid-size', gridSize);

      for (let r = 0; r < gridSize; r++) {
        for (let c = 0; c < gridSize; c++) {
          const cell = document.createElement('div');
          cell.className = 'cw-cell';

          if (solution[r][c]) {
            cell.classList.add('active');
            const input = document.createElement('input');
            input.setAttribute('maxlength', '1');
            input.dataset.row = String(r);
            input.dataset.col = String(c);
            input.setAttribute('aria-label', `خلية ${r + 1}-${c + 1}`);

            input.addEventListener('input', () => {
              input.value = input.value.trim().slice(0, 1);
              if (input.value) {
                const next = crosswordBoard.querySelector(`input[data-row="${r}"][data-col="${c + 1}"]`) ||
                             crosswordBoard.querySelector(`input[data-row="${r + 1}"][data-col="${c}"]`);
                if (next) next.focus();
              }
            });

            input.addEventListener('keydown', (e) => {
              if (e.key === 'Backspace' && !input.value) {
                const prev = crosswordBoard.querySelector(`input[data-row="${r}"][data-col="${c - 1}"]`) ||
                             crosswordBoard.querySelector(`input[data-row="${r - 1}"][data-col="${c}"]`);
                if (prev) prev.focus();
              }
            });

            cell.appendChild(input);

            const startNumber = numberMap[`${r}-${c}`];
            if (startNumber) {
              const num = document.createElement('span');
              num.className = 'cw-number';
              num.textContent = startNumber;
              cell.appendChild(num);
            }
          } else {
            cell.classList.add('blocked');
          }

          crosswordBoard.appendChild(cell);
        }
      }
    }

    if (checkCrosswordBtn && crosswordResult && crosswordBoard) {
      checkCrosswordBtn.addEventListener('click', () => {
        const inputs = crosswordBoard.querySelectorAll('input');
        inputs.forEach((input) => {
          const r = Number(input.dataset.row);
          const c = Number(input.dataset.col);
          const expected = normalizeArabic(solution[r][c]);
          const actual = normalizeArabic(input.value);

          if (actual === expected) {
            input.classList.add('correct');
            input.classList.remove('wrong');
          } else {
            input.classList.add('wrong');
            input.classList.remove('correct');
          }
        });

        let solvedWords = 0;
        placements.forEach((item) => {
          const chars = [...item.word];
          const typed = chars.map((_, index) => {
            const row = item.row + (item.clueType === 'down' ? index : 0);
            const col = item.col + (item.clueType === 'across' ? index : 0);
            const input = crosswordBoard.querySelector(`input[data-row="${row}"][data-col="${col}"]`);
            return input ? input.value : '';
          }).join('');

          if (normalizeArabic(typed) === normalizeArabic(item.word)) {
            solvedWords++;
          }
        });

        crosswordResult.textContent = `أصبت ${solvedWords} من 12 كلمة. هذه نتيجة لا بأس بها اجتماعياً، وقد تكون مقلقة معرفياً.`;
        crosswordResult.classList.add('show-result');
      });
    }
  }
});