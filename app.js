/* ===================================================
   오정국 변호사 음주운전 처벌 수위 AI 예측 시스템
   Frontend Logic (No Backend)
   =================================================== */

document.addEventListener('DOMContentLoaded', () => {
  // ---- DOM References ----
  const steps = document.querySelectorAll('.step-card:not(.result-card)');
  const resultCard = document.getElementById('resultCard');
  const resultContent = document.getElementById('resultContent');
  const prevBtn = document.getElementById('prevBtn');
  const nextBtn = document.getElementById('nextBtn');
  const navButtons = document.getElementById('navButtons');
  const progressFill = document.getElementById('progressFill');
  const progressSteps = document.querySelectorAll('.progress-step');
  const progressWrapper = document.getElementById('progressWrapper');
  const submitBtn = document.getElementById('submitBtn');
  const loadingOverlay = document.getElementById('loadingOverlay');

  let currentStep = 0;
  const totalSteps = steps.length;

  // ---- Step Navigation ----
  function goToStep(index, direction = 'next') {
    if (index < 0 || index >= totalSteps) return;

    const currentCard = steps[currentStep];
    const nextCard = steps[index];

    // Exit animation
    currentCard.classList.remove('active');
    if (direction === 'next') {
      currentCard.classList.add('exit-left');
    }

    setTimeout(() => {
      currentCard.classList.remove('exit-left');
    }, 500);

    // Enter animation
    if (direction === 'prev') {
      nextCard.style.transform = 'translateX(-60px) scale(0.96)';
    } else {
      nextCard.style.transform = 'translateX(60px) scale(0.96)';
    }

    requestAnimationFrame(() => {
      nextCard.classList.add('active');
      nextCard.style.transform = '';
    });

    currentStep = index;
    updateUI();
  }

  function updateUI() {
    // Previous button
    prevBtn.disabled = currentStep === 0;

    // Next button visibility
    if (currentStep === totalSteps - 1) {
      nextBtn.style.display = 'none';
    } else {
      nextBtn.style.display = '';
    }

    // Progress bar
    const pct = ((currentStep + 1) / totalSteps) * 100;
    progressFill.style.width = pct + '%';

    // Progress step dots
    progressSteps.forEach((el, i) => {
      el.classList.remove('active', 'completed');
      if (i < currentStep) el.classList.add('completed');
      if (i === currentStep) el.classList.add('active');
    });

    // Scroll to top of card
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // Validation per step
  function validateStep(index) {
    const card = steps[index];
    const groups = card.querySelectorAll('.question-group');
    let valid = true;

    groups.forEach(group => {
      group.classList.remove('invalid');

      const radios = group.querySelectorAll('input[type="radio"]');
      const select = group.querySelector('select');
      const textInputs = group.querySelectorAll('input[type="text"], input[type="tel"]');

      if (radios.length > 0) {
        const name = radios[0].name;
        const checked = group.querySelector(`input[name="${name}"]:checked`);
        if (!checked) {
          group.classList.add('invalid');
          valid = false;
        }
      }

      if (select && !select.value) {
        group.classList.add('invalid');
        valid = false;
      }

      textInputs.forEach(input => {
        // Only validate name (phone is optional-ish but we'll be lenient)
        if (input.id === 'userName' && !input.value.trim()) {
          group.classList.add('invalid');
          valid = false;
        }
      });
    });

    if (!valid) {
      // Remove invalid highlight after some time
      setTimeout(() => {
        groups.forEach(g => g.classList.remove('invalid'));
      }, 2000);
    }

    return valid;
  }

  // Next button
  nextBtn.addEventListener('click', () => {
    if (!validateStep(currentStep)) return;
    goToStep(currentStep + 1, 'next');
  });

  // Previous button
  prevBtn.addEventListener('click', () => {
    goToStep(currentStep - 1, 'prev');
  });

  // ---- Submit / Analysis ----
  submitBtn.addEventListener('click', () => {
    if (!validateStep(currentStep)) return;
    runAnalysis();
  });

  function getVal(name) {
    const el = document.querySelector(`input[name="${name}"]:checked`);
    return el ? el.value : '';
  }

  function getSelectVal(id) {
    const el = document.getElementById(id);
    return el ? el.value : '';
  }

  function runAnalysis() {
    // Gather all values
    const data = {
      bac: getVal('bac'),
      rinse: getVal('rinse'),
      wait20: getVal('wait20'),
      priors: getVal('priors'),
      lastYear: getSelectVal('lastYear'),
      probation: getVal('probation'),
      accident: getVal('accident'),
      job: getVal('job'),
      distance: getVal('distance'),
      stage: getVal('stage'),
      name: document.getElementById('userName').value.trim(),
      phone: document.getElementById('userPhone').value.trim(),
    };

    // Show loading
    loadingOverlay.classList.add('active');

    // Simulate analysis delay (1.8s)
    setTimeout(() => {
      loadingOverlay.classList.remove('active');
      const result = calculateResult(data);
      showResult(result, data);
    }, 1800);
  }

  // ---- Calculation Logic ----
  function calculateResult(d) {
    // 🔴 위험군
    if (
      d.priors === 'multiple' ||
      d.probation === 'yes' ||
      d.accident === 'injury' ||
      d.accident === 'hitrun' ||
      d.bac === 'refused'
    ) {
      return 'danger';
    }

    // 🟡 주의군
    if (
      d.bac === 'mid' &&
      d.priors === 'none' &&
      d.accident === 'none'
    ) {
      return 'warning';
    }

    // 🟢 안전군 (그 외)
    return 'safe';
  }

  // ---- Result Display ----
  const RESULTS = {
    danger: {
      emoji: '🔴',
      badge: '위험: 구공판 및 실형 위험 단계',
      gaugePos: 85,
      title: '즉각적인 법률 대응이 필요한 상황입니다.',
      punishment: [
        '징역 1년~5년 이상 구형 가능성이 높습니다.',
        '벌금형 배제, 정식 재판 회부가 예상됩니다.',
        '면허 취소 및 결격 기간 장기 부과가 됩니다.',
        '직업에 따라 해임·파면 등 행정처분이 병과될 수 있습니다.',
      ],
      advice: [
        '즉시 변호인을 선임하여 초동 수사 대응 전략을 수립하세요.',
        '경찰·검찰 조사 전 진술 거부권을 행사하고, 불리한 자백을 피하세요.',
        '측정 절차상 하자(구강 세척 미실시, 20분 미경과 등)가 있다면 위법수집증거 배제를 주장할 수 있습니다.',
        '반성문, 합의서, 재발방지서약서 등 양형 자료를 사전에 준비하세요.',
        '공판 단계에서는 재판부 심증을 좌우할 유리한 정상 자료가 핵심입니다.',
      ],
      badgeClass: 'danger',
    },
    warning: {
      emoji: '🟡',
      badge: '주의: 구약식 벌금형 또는 정식재판 경계선',
      gaugePos: 50,
      title: '벌금형이 유력하나, 대응에 따라 결과가 달라질 수 있습니다.',
      punishment: [
        '벌금 300만~700만 원 범위의 약식명령이 예상됩니다.',
        '면허 정지(100일) 또는 면허 취소 처분이 가능합니다.',
        '검찰 판단에 따라 정식재판으로 전환될 수 있습니다.',
        '전과 기록(벌금형)이 남으며, 향후 재범 시 가중 처벌됩니다.',
      ],
      advice: [
        '초범 감경 사유를 적극 주장하면 벌금을 낮출 수 있습니다.',
        '측정 과정의 절차적 하자를 확인하여 감경·무죄 주장 여부를 검토하세요.',
        '약식명령에 불복할 경우 정식재판 청구가 가능하나, 형량 상향 위험도 있습니다.',
        '반성문 제출, 알코올 치료 수강 등 양형 유리 사유를 확보하세요.',
        '직업적 불이익(면허 관련)에 대한 선제적 대비가 필요합니다.',
      ],
      badgeClass: 'warning',
    },
    safe: {
      emoji: '🟢',
      badge: '선처 가능 권역',
      gaugePos: 18,
      title: '비교적 유리한 상황이나, 전문가 검토가 권장됩니다.',
      punishment: [
        '벌금 200만~500만 원 범위의 약식명령이 예상됩니다.',
        '면허 정지(100일) 처분이 일반적입니다.',
        '초범·저농도 감경 시 벌금이 더 낮아질 수 있습니다.',
        '사안에 따라 기소유예 또는 선고유예 가능성도 있습니다.',
      ],
      advice: [
        '측정 절차의 위법 사유가 있다면 무죄 주장의 여지가 있습니다.',
        '구강 세척 기회 미부여, 20분 미경과 등은 증거능력 다툼의 핵심입니다.',
        '단거리 운전, 대리운전 호출 중 적발 등 정상 참작 사유를 정리하세요.',
        '반성문과 재발방지서약서를 준비하면 감경에 도움이 됩니다.',
        '향후 면허 관련 행정심판도 별도로 준비하시기 바랍니다.',
      ],
      badgeClass: 'safe',
    },
  };

  function showResult(type, data) {
    const r = RESULTS[type];

    resultContent.innerHTML = `
      <!-- Gauge Section -->
      <div class="result-gauge-section">
        <div class="gauge-container">
          <div class="gauge-bar">
            <div class="gauge-pointer" id="gaugePointer" style="left: 0%"></div>
          </div>
          <div class="gauge-labels">
            <span>선처 가능</span>
            <span>경계</span>
            <span>실형 위험</span>
          </div>
        </div>
        <div class="result-badge ${r.badgeClass}">${r.emoji} ${r.badge}</div>
        <p class="result-title">${r.title}</p>
      </div>

      <!-- Punishment Section -->
      <div class="result-section">
        <h3 class="result-section-title">
          <span class="section-icon">📋</span> 예상 법적 처분
        </h3>
        <ul class="result-list">
          ${r.punishment.map(p => `<li>${p}</li>`).join('')}
        </ul>
      </div>

      <!-- Advice Section -->
      <div class="result-section">
        <h3 class="result-section-title">
          <span class="section-icon">⚖️</span> 오정국 변호사의 초동 방어 조언
        </h3>
        <ul class="result-list">
          ${r.advice.map(a => `<li>${a}</li>`).join('')}
        </ul>
      </div>

      <!-- CTA Section -->
      <div class="result-cta">
        <p class="cta-title">오정국 변호사에게 1:1 긴급 비밀 상담 신청하기</p>
        <p class="cta-subtitle">${data.name ? data.name + '님, ' : ''}지금 바로 전문 변호사의 맞춤 상담을 받아보세요.</p>
        <div class="cta-buttons">
          <a href="#" class="cta-btn kakao" onclick="return false;">
            💬 카카오톡 상담
          </a>
          <a href="tel:010-0000-0000" class="cta-btn phone">
            📞 전화 상담
          </a>
        </div>
      </div>

      <!-- Retry -->
      <div class="retry-section">
        <button class="retry-btn" id="retryBtn" type="button">
          🔄 다시 분석하기
        </button>
      </div>
    `;

    // Hide form steps + nav
    steps.forEach(s => {
      s.classList.remove('active');
      s.style.display = 'none';
    });
    navButtons.classList.add('hidden');
    progressWrapper.style.display = 'none';

    // Show result
    resultCard.classList.add('active');

    // Animate gauge pointer
    setTimeout(() => {
      const pointer = document.getElementById('gaugePointer');
      if (pointer) {
        pointer.style.left = r.gaugePos + '%';
      }
    }, 300);

    // Retry button
    setTimeout(() => {
      const retryBtn = document.getElementById('retryBtn');
      if (retryBtn) {
        retryBtn.addEventListener('click', resetForm);
      }
    }, 100);
  }

  function resetForm() {
    // Hide result
    resultCard.classList.remove('active');

    // Reset all inputs
    document.querySelectorAll('input[type="radio"]').forEach(r => r.checked = false);
    document.querySelectorAll('select').forEach(s => s.selectedIndex = 0);
    document.getElementById('userName').value = '';
    document.getElementById('userPhone').value = '';

    // Show form
    steps.forEach(s => s.style.display = '');
    navButtons.classList.remove('hidden');
    progressWrapper.style.display = '';

    currentStep = 0;
    steps[0].classList.add('active');
    updateUI();
  }

  // ---- Auto-advance on selection (delight) ----
  document.querySelectorAll('input[type="radio"]').forEach(radio => {
    radio.addEventListener('change', () => {
      // brief visual feedback on the parent card
      const body = radio.closest('.radio-card, .radio-pill');
      if (body) {
        body.style.transition = 'transform 0.15s var(--ease-out-back)';
        body.style.transform = 'scale(0.97)';
        setTimeout(() => { body.style.transform = ''; }, 150);
      }
    });
  });

  // ---- Phone input formatting ----
  const phoneInput = document.getElementById('userPhone');
  phoneInput.addEventListener('input', (e) => {
    let v = e.target.value.replace(/[^0-9]/g, '');
    if (v.length > 11) v = v.slice(0, 11);
    if (v.length >= 8) {
      v = v.slice(0, 3) + '-' + v.slice(3, 7) + '-' + v.slice(7);
    } else if (v.length >= 4) {
      v = v.slice(0, 3) + '-' + v.slice(3);
    }
    e.target.value = v;
  });

  // ---- Initialize ----
  updateUI();
});
