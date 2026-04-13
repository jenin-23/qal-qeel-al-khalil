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

  const copyButtons = document.querySelectorAll('.copy-btn');

  function showToast(message) {
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 1800);
  }

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

  /* Entertainment page logic */
  if (document.body.dataset.page === 'entertainment') {
    const birthdayModal = document.getElementById('birthdayModal');
    const aprilModal = document.getElementById('aprilModal');
    const closeAprilModal = document.getElementById('closeAprilModal');
    const monthButtons = document.querySelectorAll('.month-btn');
    const zodiacName = document.getElementById('zodiacName');
    const zodiacText = document.getElementById('zodiacText');

    const zodiacByMonth = {
      'يناير': { name: 'الجدي / الدلو', text: 'أنت داخل بين برجين، وهذا يفسر جزءاً من التعقيد دون أن يحله.' },
      'فبراير': { name: 'الدلو / الحوت', text: 'لديك قابلية محترمة لفهم أشياء لا يمكن شرحها بشكل يساعد أحداً.' },
      'مارس': { name: 'الحوت / الحمل', text: 'تشعر كثيراً، ثم تقرر فجأة. هذا ليس تناقضاً بقدر ما هو جدول مزدحم.' },
      'أبريل': { name: 'الحمل', text: 'ستبدأ شيئاً هذا الشهر دون حاجة حقيقية لانتظار موافقة داخلية أو خارجية. وتعتبر ذلك منطقياً.' },
      'مايو': { name: 'الثور / الجوزاء', text: 'جزء منك ثابت، والجزء الآخر يتكلم كثيراً عن التغيير دون أن يزعج الثبات فعلياً.' },
      'يونيو': { name: 'الجوزاء / السرطان', text: 'ستقول ما تشعر به، أو ستشعر بما تقوله، وفي الحالتين سيضيع الترتيب.' },
      'يوليو': { name: 'السرطان / الأسد', text: 'تحمل قلباً حساساً، لكنك تفضّل أحياناً أن يصل الخبر للناس بصيغة أكثر فخامة.' },
      'أغسطس': { name: 'الأسد / العذراء', text: 'تريد أن تلمع، لكن بترتيب صحيح. وهذا يستهلك وقتاً لا يستهان به.' },
      'سبتمبر': { name: 'العذراء / الميزان', text: 'تلاحظ كل شيء، ثم تتردد في إعلان ملاحظتك حتى تصبح أكثر إزعاجاً.' },
      'أكتوبر': { name: 'الميزان / العقرب', text: 'تبدأ متوازناً ثم تكتشف أنك تحفظ أكثر مما ينبغي عن الآخرين.' },
      'نوفمبر': { name: 'العقرب / القوس', text: 'أنت مزيج غير مريح من العمق والصراحة. والناس تحتاج وقتاً للتعافي من هذا.' },
      'ديسمبر': { name: 'القوس / الجدي', text: 'ترغب بالانطلاق، لكنك في الوقت نفسه تريد جدولاً وخطة ومحضر متابعة.' }
    };

    monthButtons.forEach((btn) => {
      btn.addEventListener('click', () => {
        const month = btn.dataset.month;
        const zodiac = zodiacByMonth[month];

        if (zodiacName && zodiacText && zodiac) {
          zodiacName.textContent = zodiac.name;
          zodiacText.textContent = zodiac.text;
        }

        if (birthdayModal) birthdayModal.classList.remove('show');

        if (month === 'أبريل') {
          if (aprilModal) {
            aprilModal.classList.add('show');
            document.body.style.overflow = 'hidden';
          }
        } else {
          document.body.style.overflow = '';
        }
      });
    });

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

    const flipCoinBtn = document.getElementById('flipCoinBtn');
    const coin = document.getElementById('coin');
    const coinResult = document.getElementById('coinResult');

    if (flipCoinBtn && coin && coinResult) {
      flipCoinBtn.addEventListener('click', () => {
        coin.classList.toggle('flipped');
        coinResult.textContent = 'النتيجة النهائية بعد مراجعة الوجهين: خرا';
      });
    }

    const quizForm = document.getElementById('quizForm');
    const quizResult = document.getElementById('quizResult');

    if (quizForm && quizResult) {
      quizForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const data = new FormData(quizForm);
        let scoreA = 0;
        let scoreB = 0;
        let scoreC = 0;
        let scoreD = 0;

        for (const [, value] of data.entries()) {
          if (value === 'a') scoreA++;
          if (value === 'b') scoreB++;
          if (value === 'c') scoreC++;
          if (value === 'd') scoreD++;
        }

        let resultText = 'أنت حالة انتقالية غير معرّفة، وهذا بحد ذاته إنجاز.';
        if (scoreA >= scoreB && scoreA >= scoreC && scoreA >= scoreD) {
          resultText = 'أنت الشخص الذي ما يزال يظن أن التحليل وحده شكل من أشكال النجاة. ليس دائماً، لكنه يعطي مظهراً محترماً.';
        } else if (scoreB >= scoreA && scoreB >= scoreC && scoreB >= scoreD) {
          resultText = 'أنت من فئة الشرح المستمر: لا ترفض الحقيقة، فقط تفضّل أن تصل بعد أربع مقدمات وثلاث ملاحظات جانبية.';
        } else if (scoreC >= scoreA && scoreC >= scoreB && scoreC >= scoreD) {
          resultText = 'أنت من أهل الإشارة والتلميح والقراءة بين السطور. وهذا جميل نظرياً، لكنه مرهق عملياً.';
        } else if (scoreD >= scoreA && scoreD >= scoreB && scoreD >= scoreC) {
          resultText = 'أنت من جماعة التأجيل الناضج: لا تهرب من المشكلة، فقط تمنحها وقتاً كافياً لتعيد تعريف نفسها.';
        }

        quizResult.textContent = resultText;
        quizResult.classList.add('show-result');
      });
    }

    const crosswordGrid = document.getElementById('crosswordGrid');
    if (crosswordGrid) {
      for (let i = 0; i < 100; i++) {
        const cell = document.createElement('div');
        cell.className = 'crossword-cell';
        crosswordGrid.appendChild(cell);
      }
    }

    const checkCrosswordBtn = document.getElementById('checkCrosswordBtn');
    const crosswordResult = document.getElementById('crosswordResult');
    const crosswordInputs = document.querySelectorAll('.crossword-word input');

    if (checkCrosswordBtn && crosswordResult && crosswordInputs.length) {
      checkCrosswordBtn.addEventListener('click', () => {
        let correct = 0;

        crosswordInputs.forEach((input) => {
          const userValue = input.value.trim().replace(/\s+/g, '');
          const answer = input.dataset.answer.trim().replace(/\s+/g, '');
          if (userValue === answer) {
            correct++;
            input.classList.add('correct');
            input.classList.remove('wrong');
          } else {
            input.classList.add('wrong');
            input.classList.remove('correct');
          }
        });

        crosswordResult.textContent = `أصبت ${correct} من 12. هذه نتيجة لا بأس بها اجتماعياً، وقد تكون مقلقة معرفياً.`;
        crosswordResult.classList.add('show-result');
      });
    }
  }
});