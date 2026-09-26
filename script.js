/* 1. PERFIL — usa textContent para inserir textos sem interpretar HTML. */
(() => {
  'use strict';
  document.documentElement.classList.add('js');
  const config = window.PORTFOLIO_CONFIG || {};
  const $ = (selector) => document.querySelector(selector);
  const safeHttps = (value) => { try { const url = new URL(value); return url.protocol === 'https:' ? url.href : ''; } catch { return ''; } };
  document.querySelectorAll('[data-profile]').forEach((element) => {
    const value = config[element.dataset.profile];
    if (value) element.textContent = value;
  });
  $('#year').textContent = new Date().getFullYear();
  if (config.name) {
    document.title = `${config.name} — Portfólio pessoal`;
    $('.header .brand').setAttribute('aria-label', `${config.name}, início`);
  }
  if (config.initials) $('#portrait-initials').replaceChildren(document.createTextNode(config.initials), Object.assign(document.createElement('span'), { textContent: '.' }));
  if (config.photo && /^(assets\/|https:\/\/)/.test(config.photo)) {
    const photo = $('#profile-photo');
    photo.addEventListener('load', () => { photo.hidden = false; $('#portrait-placeholder').hidden = true; });
    photo.addEventListener('error', () => { photo.hidden = true; $('#portrait-placeholder').hidden = false; });
    photo.alt = config.photoAlt || config.name || 'Foto profissional';
    photo.src = config.photo;
  }
  let socialCount = 0;
  ['github', 'linkedin'].forEach((network) => {
    const url = safeHttps(config[network]);
    if (url) { const link = $(`#${network}-link`); link.href = url; link.hidden = false; socialCount++; }
  });
  $('#social-placeholder').hidden = socialCount > 0;
  if (config.email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(config.email)) {
    const link = $('#email-link');
    link.href = `mailto:${config.email}`; link.textContent = config.email; link.hidden = false;
  }

  /* 2. MENU — funciona com teclado, Escape e seleção de uma seção. */
  const menu = $('.menu-toggle');
  const nav = $('#nav');
  menu.hidden = false;
  const closeMenu = () => { menu.setAttribute('aria-expanded', 'false'); nav.classList.remove('is-open'); };
  menu.addEventListener('click', () => {
    const open = menu.getAttribute('aria-expanded') !== 'true';
    menu.setAttribute('aria-expanded', String(open)); nav.classList.toggle('is-open', open);
  });
  nav.addEventListener('click', (event) => { if (event.target.closest('a')) closeMenu(); });
  document.addEventListener('keydown', (event) => { if (event.key === 'Escape' && nav.classList.contains('is-open')) { closeMenu(); menu.focus(); } });
  // A seção visível recebe aria-current, sem depender apenas de uma cor.
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      const entry = entries.find((item) => item.isIntersecting);
      if (!entry) return;
      nav.querySelectorAll('a').forEach((link) => {
        if (link.hash === `#${entry.target.id}`) link.setAttribute('aria-current', 'location');
        else link.removeAttribute('aria-current');
      });
    }, { rootMargin: '-10% 0px -65% 0px', threshold: 0 });
    document.querySelectorAll('main section[id]').forEach((section) => observer.observe(section));
  }

  /* 3. PROJETOS — textos detalhados e links opcionais para trabalhos reais. */
  const projects = {
    vendas: { title: 'Dashboard de vendas', description: 'Projeto em desenvolvimento, ainda não concluído. Dashboard em Python e Streamlit para analisar pedidos de uma lanchonete. O projeto separa os dados de exemplo, as funções de cálculo e a apresentação dos indicadores. A capa é ilustrativa, não uma captura da aplicação.', details: ['Indicadores de faturamento total, quantidade de pedidos, ticket médio e unidades vendidas.', 'Gráficos de unidades vendidas e faturamento por produto.', 'Tratamento de cenários sem vendas e organização do código em módulos de dados, análise e interface.'] },
    tarefas: { title: 'To-Do List', description: 'Aplicação de lista de tarefas feita com HTML, CSS e JavaScript. A capa é uma ilustração conceitual, não uma captura da interface do repositório.', details: ['Criação, edição, conclusão e exclusão de tarefas.', 'Filtros por status e alternância de tema claro e escuro.', 'Persistência das tarefas no navegador com LocalStorage.'] }
  };
  const dialog = $('#project-dialog');
  document.querySelectorAll('[data-project]').forEach((button) => {
    button.addEventListener('click', () => {
      const project = projects[button.dataset.project];
      if (!project) return;
      $('#dialog-title').textContent = project.title;
      $('#dialog-description').textContent = project.description;
      $('#dialog-details').replaceChildren(...project.details.map((detail) => Object.assign(document.createElement('li'), { textContent: detail })));
      const url = safeHttps(config.projectLinks?.[button.dataset.project]);
      const external = $('#project-external');
      external.hidden = !url;
      if (url) external.href = url; else external.removeAttribute('href');
      dialog.showModal();
    });
  });
  $('.dialog-close').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', (event) => { if (event.target === dialog) { const rect = dialog.getBoundingClientRect(); if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close(); } });

  /* 4. CONTATO — valida os campos, evita envios repetidos e informa falhas reais.
     O servidor do FormSubmit também precisa validar os dados; validação no cliente
     melhora a experiência, mas não substitui a proteção do serviço. */
  const form = $('#contact-form');
  form.noValidate = true;
  const submit = $('#submit-button');
  const status = $('#form-status');
  const endpoint = safeHttps(config.formEndpoint);
  const configured = endpoint && new URL(endpoint).hostname === 'formsubmit.co' && new URL(endpoint).pathname.startsWith('/ajax/');
  $('#contact-setup').textContent = configured ? 'Use este espaço para oportunidades, projetos e novas conexões.' : 'O formulário aguarda a configuração do e-mail de destino.';
  const setStatus = (message, state = '') => { status.textContent = message; status.dataset.state = state; };
  const validate = (field) => {
    const value = field.value.trim();
    let error = '';
    if (!value) error = 'Preencha este campo.';
    else if (field.id === 'name' && value.length < 2) error = 'Informe um nome com pelo menos 2 caracteres.';
    else if (field.id === 'email' && field.validity.typeMismatch) error = 'Informe um e-mail válido, como nome@exemplo.com.';
    else if (field.id === 'message' && value.length < 10) error = 'Escreva uma mensagem com pelo menos 10 caracteres.';
    else if (field.maxLength > 0 && value.length > field.maxLength) error = `Use no máximo ${field.maxLength} caracteres.`;
    $(`#${field.id}-error`).textContent = error;
    field.setAttribute('aria-invalid', String(Boolean(error)));
    return !error;
  };
  const fields = [$('#name'), $('#email'), $('#message')];
  fields.forEach((field) => field.addEventListener('input', () => { if (field.getAttribute('aria-invalid') === 'true') validate(field); }));
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (submit.disabled) return;
    const validity = fields.map(validate);
    if (validity.includes(false)) { setStatus('Revise os campos indicados antes de enviar.', 'error'); fields[validity.indexOf(false)].focus(); return; }
    if (!configured) { setStatus('O envio ainda não está configurado. Utilize os links de contato disponíveis.', 'error'); return; }
    if ($('#website').value) { setStatus('Não foi possível enviar. Atualize a página e tente novamente.', 'error'); return; }
    submit.disabled = true; form.setAttribute('aria-busy', 'true'); submit.textContent = 'Enviando...'; setStatus('Enviando sua mensagem.');
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20000);
    try {
      const response = await fetch(endpoint, {
        method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, signal: controller.signal,
        body: JSON.stringify({ name: $('#name').value.trim(), email: $('#email').value.trim(), message: $('#message').value.trim(), _subject: `Novo contato pelo portfólio — ${config.name || 'Portfólio'}`, _template: 'table', _honey: '' })
      });
      const result = await response.json();
      if (!response.ok || !(result.success === true || result.success === 'true')) throw new Error('service');
      // O aceite pelo serviço não comprova entrega na caixa de entrada.
      setStatus('Mensagem recebida pelo serviço de envio. Obrigado pelo contato!', 'success');
      form.reset(); fields.forEach((field) => field.removeAttribute('aria-invalid'));
    } catch (error) {
      setStatus(error.name === 'AbortError' ? 'O serviço demorou a responder. O envio não foi confirmado. Você pode tentar novamente ou usar o e-mail ao lado.' : 'Não foi possível confirmar o envio. Seus dados foram mantidos; tente novamente ou use o e-mail ao lado.', 'error');
    } finally {
      clearTimeout(timeout); submit.disabled = false; form.removeAttribute('aria-busy'); submit.replaceChildren(document.createTextNode('Enviar mensagem '), Object.assign(document.createElement('span'), { textContent: '↗' })); submit.lastElementChild.setAttribute('aria-hidden', 'true');
    }
  });
})();

