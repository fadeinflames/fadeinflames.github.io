export const profile = {
  name: 'Максим Гусев',
  username: 'fadeinflames',
  role: 'SRE Team Lead',
  company: 'RWB',
  location: 'Москва',
  github: 'https://github.com/fadeinflames',
  telegram: 'https://t.me/fadeinflames',
  telegramChannel: 'https://t.me/youngmaxnotes',
  bookingUrl: 'https://cal.com/fadeinflames/30min',
};

// Only verified public repositories are included. Forks are not presented as original work.
export const projects = [
  { slug: 'yandex-k8s-practice', title: 'Kubernetes на практике', description: 'Материалы для студентов курса Яндекса по Kubernetes: Helm-чарт, развёртывание приложения и cert-manager.', tags: ['Kubernetes', 'Helm', 'YAML'], category: 'Обучение', art: 'cluster', code: '01' },
  { slug: 'gitlab-runner-in-docker', title: 'GitLab Runner в Docker', description: 'Конфигурация для запуска GitLab Runner в Docker. Небольшой инструмент для повседневной работы с CI/CD.', tags: ['Docker', 'GitLab CI', 'Shell'], category: 'Инфраструктура', art: 'pipeline', code: '02' },
  { slug: 'corosync', title: 'Конфигурация Corosync', description: 'Пример конфигурации Corosync — открытый репозиторий с настройкой кластерного взаимодействия.', tags: ['Corosync', 'Clustering'], category: 'Инфраструктура', art: 'quorum', code: '03' },
];
