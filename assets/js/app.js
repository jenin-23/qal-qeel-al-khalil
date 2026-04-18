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

  function showToast(message) {
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 1800);
  }

  // =========================
  // Global modal / coming soon
  // =========================
  triggers.forEach((item) => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      const title = item.getAttribute('data-title') || defaultTitle;
      const text =
        item.getAttribute('data-text') ||
        'يزم محنا حكينا قادم، مش حتلاقي اشي.';
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
    if (e.key === 'Escape') {
      closeModal();

      const aprilModal = document.getElementById('aprilModal');
      const birthdayModal = document.getElementById('birthdayModal');

      if (aprilModal && aprilModal.classList.contains('show')) {
        aprilModal.classList.remove('show');
        document.body.style.overflow = '';
      }

      if (birthdayModal && birthdayModal.classList.contains('show')) {
        // لا نغلقه بالإسكاب إذا كان مطلوبًا للدخول
      }
    }
  });

  // =========================
  // Article toggles
  // =========================
  const toggleButtons = document.querySelectorAll('.story-toggle-btn');
  toggleButtons.forEach((button) => {
    const article = button.closest('.story-card');
    const body = article ? article.querySelector('.story-body') : null;
    if (!body || body.classList.contains('no-collapse')) return;

    button.addEventListener('click', () => {
      const collapsed = body.classList.contains('is-collapsed');
      body.classList.toggle('is-collapsed');
      button.classList.toggle('is-open');

      if (!collapsed && article) {
        article.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

  // =========================
  // Copy article buttons
  // =========================
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
        const originalText = button.textContent;
        button.classList.add('copied');
        button.textContent = 'تم النسخ';
        showToast('تم نسخ المقال. استخدمه بحذر.');
        setTimeout(() => {
          button.classList.remove('copied');
          button.textContent = originalText || 'انسخ المقال';
        }, 1800);
      } catch {
        showToast('تعذّر النسخ حالياً.');
      }
    });
  });

  // =========================
  // Copy phone buttons
  // =========================
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

  // =========================
  // Article reactions
  // =========================
  const reactionButtons = document.querySelectorAll('.reaction-btn');
  reactionButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const container = button.closest('.reaction-options');
      if (!container) return;

      container.querySelectorAll('.reaction-btn').forEach((btn) => {
        btn.classList.remove('is-selected');
      });

      button.classList.add('is-selected');
      showToast('تم تسجيل انطباعك التحريري.');
    });
  });

  // =========================
  // Fake contact form handling
  // =========================
  const contactForm = document.querySelector('.contact-form');
  if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
      e.preventDefault();
      showToast('تم استلام الرسالة نظرياً. شكراً على الثقة.');
      contactForm.reset();
    });
  }

  // =========================
  // Entertainment page
  // =========================
  if (document.body.dataset.page === 'entertainment') {
    const birthdayModal = document.getElementById('birthdayModal');
    const birthdayForm = document.getElementById('birthdayForm');
    const aprilModal = document.getElementById('aprilModal');
    const closeAprilModal = document.getElementById('closeAprilModal');

    const zodiacName = document.getElementById('zodiacName');
    const zodiacText = document.getElementById('zodiacText');

    const flipCoinBtn = document.getElementById('flipCoinBtn');
    const coin = document.getElementById('coin');
    const coinResult = document.getElementById('coinResult');

    const quizForm = document.getElementById('quizForm');
    const quizResult = document.getElementById('quizResult');

    const zodiacPredictions = {
      'الحمل':
        'أنت لا تنتظر الضوء الأخضر غالباً، لأنك تعتبر مجرد وجود الفكرة إذناً كافياً. هذا الشهر ستدخل في أمرٍ جديد بسرعة محترمة، ثم تتفاجأ أن الاستمرار فيه يتطلب أكثر من الحماس الأول.',
      'الثور':
        'ستتمسك هذا الشهر بموقفك كما لو كان قطعة أثاث ثقيلة في بيت قديم: لا حاجة فعلية لبقائه، لكن فكرة تحريكه وحدها مرهقة وغير محببة.',
      'الجوزاء':
        'ستنجح في حمل رأيين متعارضين في الجملة نفسها، ثم تنزعج من الطرف الذي طلب منك الوضوح. وهذه موهبة اجتماعية قديمة لا يُستهان بها.',
      'السرطان':
        'ستفهم الجو العام قبل أن يُشرح، ثم تتأثر به أكثر مما يلزم، ثم تتصرف كأنك لم تتأثر أصلاً. وهذا مجهود داخلي لا يقدّره أحد بالحد الكافي.',
      'الأسد':
        'هناك احتمال قوي أن تدخل أي مساحة هذا الشهر بطريقة تجعل وجودك معلومة عامة لا تحتاج إعلاناً رسمياً. وستعتبر ذلك طبيعياً جداً.',
      'العذراء':
        'ستلاحظ خللاً صغيراً لم ينتبه له أحد، ثم يتحول هذا الخلل في داخلك إلى مشروع كامل لإعادة ترتيب العالم، أو على الأقل إعادة شرح سبب ضيقك.',
      'الميزان':
        'سيُطلب منك اختيار واضح، وستقدّم بدلاً منه تردداً منسقاً، مهذباً، ويصلح لأن يبدو حكمة. لكنه في النهاية سيظل تردداً جيد الإخراج.',
      'العقرب':
        'لن تقول كل ما تعرفه، لكنك ستعرف أكثر مما يقال أمامك، وهذا يضعك مرة أخرى في موقع الشخص الصامت الذي لا يبعث الطمأنينة الكافية.',
      'القوس':
        'ستبدأ الشهر بفكرة كبيرة، وربما بخطة أكبر، ثم تكتشف أن التنفيذ يتطلب بقاءك في نفس المزاج لأكثر من يومين، وهو طلب فيه قدر من الوقاحة.',
      'الجدي':
        'ستحمل ما لا يخصك بالكامل ثم تتضايق أن الآخرين لم يلاحظوا حجم التحمل كما يجب. وهذا ليس ظلماً تماماً، لكنه ليس مفهوماً لهم أيضاً.',
      'الدلو':
        'ستقترح هذا الشهر تفسيراً غير متوقع، أو حلاً غير مألوف، أو طريقاً ثالثاً لم يطلبه أحد. بعضهم سيعجب، وبعضهم سيتظاهر بالفهم، وأنت ستكمل على أي حال.',
      'الحوت':
        'سترى معنى في شيء كان يمكن لباقي الناس تجاوزه بسهولة، ثم تبني عليه مزاجاً كاملاً، ثم تدافع عن عمقك الداخلي وكأنه وثيقة رسمية مختومة.'
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

    function isValidDate(day, month, year) {
      if (!day || !month || !year) return false;
      if (month < 1 || month > 12) return false;
      if (year < 1900 || year > 2100) return false;

      const daysInMonth = new Date(year, month, 0).getDate();
      return day >= 1 && day <= daysInMonth;
    }

    if (birthdayModal && birthdayForm) {
      birthdayModal.classList.add('show');
      document.body.style.overflow = 'hidden';

      birthdayForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const day = Number(document.getElementById('birthDay')?.value);
        const month = Number(document.getElementById('birthMonth')?.value);
        const year = Number(document.getElementById('birthYear')?.value);

        if (!isValidDate(day, month, year)) {
          showToast('أدخل تاريخاً معقولاً ثم تابع.');
          return;
        }

        const zodiac = getZodiac(day, month);

        if (zodiacName && zodiacText) {
          zodiacName.textContent = zodiac;
          zodiacText.textContent = zodiacPredictions[zodiac];
        }

        birthdayModal.classList.remove('show');

        if (month === 4) {
          if (aprilModal) {
            aprilModal.classList.add('show');
            document.body.style.overflow = 'hidden';
          } else {
            document.body.style.overflow = '';
            showToast('كل عام وأنت بخير. أبريل مزدحم بما يكفي هذا العام.');
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

    // =========================
    // Coin flip
    // =========================
    if (flipCoinBtn && coin && coinResult) {
      flipCoinBtn.addEventListener('click', () => {
        const yes = Math.random() > 0.5;

        if (yes) {
          coin.classList.remove('flipped');
        } else {
          coin.classList.add('flipped');
        }

        coinResult.textContent = yes
          ? 'النتيجة: نعم. كنت ستفعلها على أي حال، وهذه الحركة فقط منحتك شعوراً زائفاً بالمشورة.'
          : 'النتيجة: لا. وستفعلها غالباً أيضاً، لكن بعد تردد قصير يسمح لك بادعاء أنك فكرت بالأمر.';
      });
    }

    // =========================
    // Quiz
    // =========================
    if (quizForm && quizResult) {
      quizForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const data = new FormData(quizForm);
        let counts = { a: 0, b: 0, c: 0, d: 0 };

        for (const [, value] of data.entries()) {
          if (counts[value] !== undefined) counts[value]++;
        }

        const answered = Object.values(counts).reduce((sum, n) => sum + n, 0);
        if (answered === 0) {
          showToast('أجب أولاً، ولو بدافع الفضول فقط.');
          return;
        }

        const dominant = Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];

        let resultText = 'أنت حالة انتقالية محترمة بين الفهم والإنكار، وهذا في حد ذاته وضع شائع أكثر مما يقال.';

        if (dominant === 'a') {
          resultText =
            'أنت من جماعة الصياغة المهذبة: تعرف ما يحدث، لكنك تفضّل تقديمه بعبارات أنعم قليلاً، كأن الحقيقة ستتقبل التغليف اللغوي بصدر رحب.';
        } else if (dominant === 'b') {
          resultText =
            'أنت من أهل الإدراك الصامت: لا تتفاجأ كثيراً، ولا تثق كثيراً، وتتعامل مع معظم الجمل الاجتماعية كما لو كانت ترجمة تقريبية لشيء آخر تماماً.';
        } else if (dominant === 'c') {
          resultText =
            'أنت من فئة الوعي المتعب: ترى الخلل، وتفهم النبرة، وتلتقط الإشارة، لكنك تستمر بالمشهد كاملاً كأنك وافقت عليه منذ البداية.';
        } else if (dominant === 'd') {
          resultText =
            'أنت من جماعة التأجيل الدفاعي: لا تنكر الواقع مباشرة، لكنك تمنحه مهلة طويلة على أمل أن يغير شكله وحده، ثم تتعامل مع ذلك كأنه خطة.';
        }

        quizResult.textContent = resultText;
        quizResult.classList.add('show-result');
      });
    }
  }
});