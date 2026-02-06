export type Language = 'english' | 'spanish' | 'french' | 'german'

export interface Translation {
  [key: string]: string | Translation
}

export const translations: Record<Language, Translation> = {
  english: {
    // Navigation
    navigation: {
      overview: 'Overview',
      pods: 'Pods',
      services: 'Services',
      deployments: 'Deployments',
      nodes: 'Nodes',
      monitoring: 'Monitoring',
      settings: 'Settings'
    },
    // General
    general: {
      clusterOverview: 'Cluster Overview',
      monitorAndManage: 'Monitor and manage your Kubernetes cluster with real-time insights',
      refresh: 'Refresh',
      connected: 'Connected',
      demoMode: 'Demo Mode'
    },
    // Settings
    settings: {
      title: 'Settings',
      subtitle: 'Configure your dashboard preferences and cluster settings',
      saveChanges: 'Save Changes',
      saved: 'Saved!',
      saving: 'Saving...',
      export: 'Export',
      general: 'General Settings',
      generalSubtitle: 'Basic cluster and dashboard configuration',
      appearance: 'Appearance',
      appearanceSubtitle: 'Customize the look and feel of your dashboard',
      notifications: 'Notifications',
      notificationsSubtitle: 'Manage your alert and notification preferences',
      security: 'Security',
      securitySubtitle: 'Configure security and authentication settings',
      api: 'API Settings',
      advanced: 'Advanced',
      dangerZone: 'Danger Zone',
      // General Settings
      clusterName: 'Cluster Name',
      refreshInterval: 'Refresh Interval',
      timezone: 'Timezone',
      language: 'Language',
      // Appearance
      theme: 'Theme',
      compactMode: 'Compact Mode',
      compactModeDesc: 'Reduce spacing and padding for more content',
      animations: 'Animations',
      animationsDesc: 'Enable smooth transitions and animations',
      sidebarCollapsed: 'Sidebar Collapsed',
      sidebarCollapsedDesc: 'Keep sidebar collapsed by default',
      // Notifications
      emailNotifications: 'Email Notifications',
      emailNotificationsDesc: 'Receive alerts via email',
      pushNotifications: 'Push Notifications',
      pushNotificationsDesc: 'Browser push notifications',
      podAlerts: 'Pod Alerts',
      podAlertsDesc: 'Alert when pods fail or restart',
      nodeAlerts: 'Node Alerts',
      nodeAlertsDesc: 'Alert when nodes go offline',
      securityAlerts: 'Security Alerts',
      securityAlertsDesc: 'Alert on security events',
      // Security
      twoFactorAuth: 'Two-Factor Authentication',
      twoFactorAuthDesc: 'Add an extra layer of security',
      sessionTimeout: 'Session Timeout',
      apiRateLimit: 'API Rate Limit',
      apiAccess: 'API Access',
      apiAccessDesc: 'Enable external API access',
      auditLogging: 'Audit Logging',
      auditLoggingDesc: 'Log all user actions',
      // API Settings
      apiKey: 'API Key',
      webhookUrl: 'Webhook URL',
      generateNewKey: 'Generate New Key',
      // Advanced
      debugMode: 'Debug Mode',
      debugModeDesc: 'Enable debug logs',
      betaFeatures: 'Beta Features',
      betaFeaturesDesc: 'Try new features',
      cacheEnabled: 'Cache Enabled',
      cacheEnabledDesc: 'Improve performance',
      metricsEnabled: 'Metrics Enabled',
      metricsEnabledDesc: 'Collect usage metrics',
      // Danger Zone
      resetSettings: 'Reset All Settings',
      resetSettingsDesc: 'Reset all settings to their default values. This action cannot be undone.',
      // Units
      seconds: 'seconds',
      minutes: 'minutes',
      hours: 'hours',
      requestsPerHour: 'requests/hour'
    },
    // Pods
    pods: {
      title: 'Pods',
      subtitle: 'Manage and monitor your container pods with real-time status',
      totalPods: 'Total Pods',
      running: 'Running',
      failed: 'Failed',
      totalRestarts: 'Total Restarts',
      healthyPods: 'Healthy pods',
      needAttention: 'Need attention',
      acrossAllNamespaces: 'Across all namespaces',
      searchPods: 'Search pods by name or namespace...',
      allNamespaces: 'All Namespaces',
      podManagement: 'Pod Management',
      podsFound: 'pods found across all namespaces',
      name: 'Name',
      namespace: 'Namespace',
      status: 'Status',
      ready: 'Ready',
      restarts: 'Restarts',
      node: 'Node',
      ip: 'IP',
      age: 'Age'
    },
    // Services
    services: {
      title: 'Services',
      subtitle: 'Monitor and manage your network services with real-time connectivity',
      totalServices: 'Total Services',
      clusterIP: 'ClusterIP',
      loadBalancer: 'LoadBalancer',
      externalIPs: 'External IPs',
      internalServices: 'Internal services',
      externalServices: 'External services',
      publiclyAccessible: 'Publicly accessible',
      searchServices: 'Search services by name or namespace...',
      serviceManagement: 'Service Management',
      servicesFound: 'services found across all namespaces',
      type: 'Type',
      clusterIp: 'Cluster IP',
      externalIp: 'External IPs',
      ports: 'Ports'
    }
  },
  spanish: {
    // Navigation
    navigation: {
      overview: 'Descripción General',
      pods: 'Pods',
      services: 'Servicios',
      deployments: 'Despliegues',
      nodes: 'Nodos',
      monitoring: 'Monitoreo',
      settings: 'Configuración'
    },
    // General
    general: {
      clusterOverview: 'Descripción General del Clúster',
      monitorAndManage: 'Monitorea y gestiona tu clúster de Kubernetes con información en tiempo real',
      refresh: 'Actualizar',
      connected: 'Conectado',
      demoMode: 'Modo Demo'
    },
    // Settings
    settings: {
      title: 'Configuración',
      subtitle: 'Configura tus preferencias del panel y configuraciones del clúster',
      saveChanges: 'Guardar Cambios',
      saved: '¡Guardado!',
      saving: 'Guardando...',
      export: 'Exportar',
      general: 'Configuración General',
      generalSubtitle: 'Configuración básica del clúster y del panel',
      appearance: 'Apariencia',
      appearanceSubtitle: 'Personaliza el look and feel de tu panel',
      notifications: 'Notificaciones',
      notificationsSubtitle: 'Gestiona tus alertas y preferencias de notificación',
      security: 'Seguridad',
      securitySubtitle: 'Configura la seguridad y configuraciones de autenticación',
      api: 'Configuración API',
      advanced: 'Avanzado',
      dangerZone: 'Zona de Peligro',
      // General Settings
      clusterName: 'Nombre del Clúster',
      refreshInterval: 'Intervalo de Actualización',
      timezone: 'Zona Horaria',
      language: 'Idioma',
      // Appearance
      theme: 'Tema',
      compactMode: 'Modo Compacto',
      compactModeDesc: 'Reduce el espaciado y relleno para más contenido',
      animations: 'Animaciones',
      animationsDesc: 'Habilita transiciones suaves y animaciones',
      sidebarCollapsed: 'Barra Lateral Contraída',
      sidebarCollapsedDesc: 'Mantener la barra lateral contraída por defecto',
      // Notifications
      emailNotifications: 'Notificaciones por Correo',
      emailNotificationsDesc: 'Recibir alertas por correo electrónico',
      pushNotifications: 'Notificaciones Push',
      pushNotificationsDesc: 'Notificaciones push del navegador',
      podAlerts: 'Alertas de Pods',
      podAlertsDesc: 'Alertar cuando los pods fallen o se reinicien',
      nodeAlerts: 'Alertas de Nodos',
      nodeAlertsDesc: 'Alertar cuando los nodos se desconecten',
      securityAlerts: 'Alertas de Seguridad',
      securityAlertsDesc: 'Alertar sobre eventos de seguridad',
      // Security
      twoFactorAuth: 'Autenticación de Dos Factores',
      twoFactorAuthDesc: 'Añade una capa extra de seguridad',
      sessionTimeout: 'Tiempo de Sesión',
      apiRateLimit: 'Límite de Tasa API',
      apiAccess: 'Acceso API',
      apiAccessDesc: 'Habilitar acceso API externo',
      auditLogging: 'Registro de Auditoría',
      auditLoggingDesc: 'Registrar todas las acciones del usuario',
      // API Settings
      apiKey: 'Clave API',
      webhookUrl: 'URL Webhook',
      generateNewKey: 'Generar Nueva Clave',
      // Advanced
      debugMode: 'Modo Depuración',
      debugModeDesc: 'Habilitar registros de depuración',
      betaFeatures: 'Características Beta',
      betaFeaturesDesc: 'Probar nuevas características',
      cacheEnabled: 'Caché Habilitado',
      cacheEnabledDesc: 'Mejorar rendimiento',
      metricsEnabled: 'Métricas Habilitadas',
      metricsEnabledDesc: 'Recopilar métricas de uso',
      // Danger Zone
      resetSettings: 'Restablecer Todas las Configuraciones',
      resetSettingsDesc: 'Restablecer todas las configuraciones a sus valores predeterminados. Esta acción no se puede deshacer.',
      // Units
      seconds: 'segundos',
      minutes: 'minutos',
      hours: 'horas',
      requestsPerHour: 'solicitudes/hora'
    },
    // Pods
    pods: {
      title: 'Pods',
      subtitle: 'Gestiona y monitorea tus pods de contenedores con estado en tiempo real',
      totalPods: 'Total de Pods',
      running: 'Ejecutándose',
      failed: 'Fallidos',
      totalRestarts: 'Reinicios Totales',
      healthyPods: 'Pods saludables',
      needAttention: 'Necesitan atención',
      acrossAllNamespaces: 'En todos los namespaces',
      searchPods: 'Buscar pods por nombre o namespace...',
      allNamespaces: 'Todos los Namespaces',
      podManagement: 'Gestión de Pods',
      podsFound: 'pods encontrados en todos los namespaces',
      name: 'Nombre',
      namespace: 'Namespace',
      status: 'Estado',
      ready: 'Listo',
      restarts: 'Reinicios',
      node: 'Nodo',
      ip: 'IP',
      age: 'Edad'
    },
    // Services
    services: {
      title: 'Servicios',
      subtitle: 'Monitorea y gestiona tus servicios de red con conectividad en tiempo real',
      totalServices: 'Total de Servicios',
      clusterIP: 'ClusterIP',
      loadBalancer: 'LoadBalancer',
      externalIPs: 'IPs Externas',
      internalServices: 'Servicios internos',
      externalServices: 'Servicios externos',
      publiclyAccessible: 'Accesible públicamente',
      searchServices: 'Buscar servicios por nombre o namespace...',
      serviceManagement: 'Gestión de Servicios',
      servicesFound: 'servicios encontrados en todos los namespaces',
      type: 'Tipo',
      clusterIp: 'IP del Clúster',
      externalIp: 'IPs Externas',
      ports: 'Puertos'
    }
  },
  french: {
    // Navigation
    navigation: {
      overview: 'Aperçu',
      pods: 'Pods',
      services: 'Services',
      deployments: 'Déploiements',
      nodes: 'Nœuds',
      monitoring: 'Surveillance',
      settings: 'Paramètres'
    },
    // General
    general: {
      clusterOverview: 'Aperçu du Cluster',
      monitorAndManage: 'Surveillez et gérez votre cluster Kubernetes avec des informations en temps réel',
      refresh: 'Actualiser',
      connected: 'Connecté',
      demoMode: 'Mode Démo'
    },
    // Settings
    settings: {
      title: 'Paramètres',
      subtitle: 'Configurez vos préférences de tableau de bord et les paramètres du cluster',
      saveChanges: 'Sauvegarder les Modifications',
      saved: 'Sauvegardé!',
      saving: 'Sauvegarde...',
      export: 'Exporter',
      general: 'Paramètres Généraux',
      generalSubtitle: 'Configuration de base du cluster et du tableau de bord',
      appearance: 'Apparence',
      appearanceSubtitle: 'Personnalisez l\'apparence de votre tableau de bord',
      notifications: 'Notifications',
      notificationsSubtitle: 'Gérez vos alertes et préférences de notification',
      security: 'Sécurité',
      securitySubtitle: 'Configurez la sécurité et les paramètres d\'authentification',
      api: 'Paramètres API',
      advanced: 'Avancé',
      dangerZone: 'Zone de Danger',
      // General Settings
      clusterName: 'Nom du Cluster',
      refreshInterval: 'Intervalle d\'Actualisation',
      timezone: 'Fuseau Horaire',
      language: 'Langue',
      // Appearance
      theme: 'Thème',
      compactMode: 'Mode Compact',
      compactModeDesc: 'Réduire l\'espacement et le remplissage pour plus de contenu',
      animations: 'Animations',
      animationsDesc: 'Activer les transitions fluides et les animations',
      sidebarCollapsed: 'Barre Latérale Réduite',
      sidebarCollapsedDesc: 'Garder la barre latérale réduite par défaut',
      // Notifications
      emailNotifications: 'Notifications Email',
      emailNotificationsDesc: 'Recevoir des alertes par email',
      pushNotifications: 'Notifications Push',
      pushNotificationsDesc: 'Notifications push du navigateur',
      podAlerts: 'Alertes de Pods',
      podAlertsDesc: 'Alerte lorsque les pods échouent ou redémarrent',
      nodeAlerts: 'Alertes de Nœuds',
      nodeAlertsDesc: 'Alerte lorsque les nœuds se déconnectent',
      securityAlerts: 'Alertes de Sécurité',
      securityAlertsDesc: 'Alerte sur les événements de sécurité',
      // Security
      twoFactorAuth: 'Authentification à Deux Facteurs',
      twoFactorAuthDesc: 'Ajouter une couche de sécurité supplémentaire',
      sessionTimeout: 'Délai d\'Expiration de Session',
      apiRateLimit: 'Limite de Taux API',
      apiAccess: 'Accès API',
      apiAccessDesc: 'Activer l\'accès API externe',
      auditLogging: 'Journal d\'Audit',
      auditLoggingDesc: 'Journaliser toutes les actions utilisateur',
      // API Settings
      apiKey: 'Clé API',
      webhookUrl: 'URL Webhook',
      generateNewKey: 'Générer Nouvelle Clé',
      // Advanced
      debugMode: 'Mode Débogage',
      debugModeDesc: 'Activer les journaux de débogage',
      betaFeatures: 'Fonctionnalités Bêta',
      betaFeaturesDesc: 'Essayer de nouvelles fonctionnalités',
      cacheEnabled: 'Cache Activé',
      cacheEnabledDesc: 'Améliorer les performances',
      metricsEnabled: 'Métriques Activées',
      metricsEnabledDesc: 'Collecter les métriques d\'utilisation',
      // Danger Zone
      resetSettings: 'Réinitialiser Tous les Paramètres',
      resetSettingsDesc: 'Réinitialiser tous les paramètres à leurs valeurs par défaut. Cette action ne peut être annulée.',
      // Units
      seconds: 'secondes',
      minutes: 'minutes',
      hours: 'heures',
      requestsPerHour: 'requêtes/heure'
    },
    // Pods
    pods: {
      title: 'Pods',
      subtitle: 'Gérez et surveillez vos pods de conteneurs avec un statut en temps réel',
      totalPods: 'Total des Pods',
      running: 'En cours',
      failed: 'Échoué',
      totalRestarts: 'Redémarrages Totaux',
      healthyPods: 'Pods sains',
      needAttention: 'Nécessitent une attention',
      acrossAllNamespaces: 'Dans tous les namespaces',
      searchPods: 'Rechercher des pods par nom ou namespace...',
      allNamespaces: 'Tous les Namespaces',
      podManagement: 'Gestion des Pods',
      podsFound: 'pods trouvés dans tous les namespaces',
      name: 'Nom',
      namespace: 'Namespace',
      status: 'Statut',
      ready: 'Prêt',
      restarts: 'Redémarrages',
      node: 'Nœud',
      ip: 'IP',
      age: 'Âge'
    },
    // Services
    services: {
      title: 'Services',
      subtitle: 'Surveillez et gérez vos services réseau avec une connectivité en temps réel',
      totalServices: 'Total des Services',
      clusterIP: 'ClusterIP',
      loadBalancer: 'LoadBalancer',
      externalIPs: 'IPs Externes',
      internalServices: 'Services internes',
      externalServices: 'Services externes',
      publiclyAccessible: 'Accessible publiquement',
      searchServices: 'Rechercher des services par nom ou namespace...',
      serviceManagement: 'Gestion des Services',
      servicesFound: 'services trouvés dans tous les namespaces',
      type: 'Type',
      clusterIp: 'IP du Cluster',
      externalIp: 'IPs Externes',
      ports: 'Ports'
    }
  },
  german: {
    // Navigation
    navigation: {
      overview: 'Übersicht',
      pods: 'Pods',
      services: 'Dienste',
      deployments: 'Bereitstellungen',
      nodes: 'Knoten',
      monitoring: 'Überwachung',
      settings: 'Einstellungen'
    },
    // General
    general: {
      clusterOverview: 'Cluster-Übersicht',
      monitorAndManage: 'Überwachen und verwalten Sie Ihren Kubernetes-Cluster mit Echtzeit-Einblicken',
      refresh: 'Aktualisieren',
      connected: 'Verbunden',
      demoMode: 'Demo-Modus'
    },
    // Settings
    settings: {
      title: 'Einstellungen',
      subtitle: 'Konfigurieren Sie Ihre Dashboard-Präferenzen und Cluster-Einstellungen',
      saveChanges: 'Änderungen Speichern',
      saved: 'Gespeichert!',
      saving: 'Speichern...',
      export: 'Exportieren',
      general: 'Allgemeine Einstellungen',
      generalSubtitle: 'Grundlegende Cluster- und Dashboard-Konfiguration',
      appearance: 'Erscheinungsbild',
      appearanceSubtitle: 'Passen Sie das Aussehen und Gefühl Ihres Dashboards an',
      notifications: 'Benachrichtigungen',
      notificationsSubtitle: 'Verwalten Sie Ihre Alarm- und Benachrichtigungseinstellungen',
      security: 'Sicherheit',
      securitySubtitle: 'Konfigurieren Sie Sicherheits- und Authentifizierungseinstellungen',
      api: 'API-Einstellungen',
      advanced: 'Erweitert',
      dangerZone: 'Gefahrenzone',
      // General Settings
      clusterName: 'Cluster-Name',
      refreshInterval: 'Aktualisierungsintervall',
      timezone: 'Zeitzone',
      language: 'Sprache',
      // Appearance
      theme: 'Thema',
      compactMode: 'Kompakter Modus',
      compactModeDesc: 'Abstand und Polsterung für mehr Inhalt reduzieren',
      animations: 'Animationen',
      animationsDesc: 'Sanfte Übergänge und Animationen aktivieren',
      sidebarCollapsed: 'Seitenleiste Reduziert',
      sidebarCollapsedDesc: 'Seitenleiste standardmäßig reduziert halten',
      // Notifications
      emailNotifications: 'E-Mail-Benachrichtigungen',
      emailNotificationsDesc: 'Alarme per E-Mail erhalten',
      pushNotifications: 'Push-Benachrichtigungen',
      pushNotificationsDesc: 'Browser-Push-Benachrichtigungen',
      podAlerts: 'Pod-Alarme',
      podAlertsDesc: 'Alarmieren, wenn Pods fehlschlagen oder neu starten',
      nodeAlerts: 'Knoten-Alarme',
      nodeAlertsDesc: 'Alarmieren, wenn Knoten offline gehen',
      securityAlerts: 'Sicherheitsalarme',
      securityAlertsDesc: 'Alarm bei Sicherheitsereignissen',
      // Security
      twoFactorAuth: 'Zwei-Faktor-Authentifizierung',
      twoFactorAuthDesc: 'Eine zusätzliche Sicherheitsebene hinzufügen',
      sessionTimeout: 'Sitzungs-Timeout',
      apiRateLimit: 'API-Ratenlimit',
      apiAccess: 'API-Zugriff',
      apiAccessDesc: 'Externen API-Zugriff aktivieren',
      auditLogging: 'Audit-Protokollierung',
      auditLoggingDesc: 'Alle Benutzeraktionen protokollieren',
      // API Settings
      apiKey: 'API-Schlüssel',
      webhookUrl: 'Webhook-URL',
      generateNewKey: 'Neuen Schlüssel Generieren',
      // Advanced
      debugMode: 'Debug-Modus',
      debugModeDesc: 'Debug-Protokolle aktivieren',
      betaFeatures: 'Beta-Funktionen',
      betaFeaturesDesc: 'Neue Funktionen ausprobieren',
      cacheEnabled: 'Cache Aktiviert',
      cacheEnabledDesc: 'Leistung verbessern',
      metricsEnabled: 'Metriken Aktiviert',
      metricsEnabledDesc: 'Nutzungsmetriken sammeln',
      // Danger Zone
      resetSettings: 'Alle Einstellungen Zurücksetzen',
      resetSettingsDesc: 'Alle Einstellungen auf ihre Standardwerte zurücksetzen. Diese Aktion kann nicht rückgängig gemacht werden.',
      // Units
      seconds: 'Sekunden',
      minutes: 'Minuten',
      hours: 'Stunden',
      requestsPerHour: 'Anfragen/Stunde'
    },
    // Pods
    pods: {
      title: 'Pods',
      subtitle: 'Verwalten und überwachen Sie Ihre Container-Pods mit Echtzeit-Status',
      totalPods: 'Gesamte Pods',
      running: 'Läuft',
      failed: 'Fehlgeschlagen',
      totalRestarts: 'Gesamte Neustarts',
      healthyPods: 'Gesunde Pods',
      needAttention: 'Benötigen Aufmerksamkeit',
      acrossAllNamespaces: 'In allen Namespaces',
      searchPods: 'Pods nach Name oder Namespace suchen...',
      allNamespaces: 'Alle Namespaces',
      podManagement: 'Pod-Verwaltung',
      podsFound: 'Pods in allen Namespaces gefunden',
      name: 'Name',
      namespace: 'Namespace',
      status: 'Status',
      ready: 'Bereit',
      restarts: 'Neustarts',
      node: 'Knoten',
      ip: 'IP',
      age: 'Alter'
    },
    // Services
    services: {
      title: 'Dienste',
      subtitle: 'Überwachen und verwalten Sie Ihre Netzwerkdienste mit Echtzeit-Konnektivität',
      totalServices: 'Gesamte Dienste',
      clusterIP: 'ClusterIP',
      loadBalancer: 'LoadBalancer',
      externalIPs: 'Externe IPs',
      internalServices: 'Interne Dienste',
      externalServices: 'Externe Dienste',
      publiclyAccessible: 'Öffentlich zugänglich',
      searchServices: 'Dienste nach Name oder Namespace suchen...',
      serviceManagement: 'Dienstverwaltung',
      servicesFound: 'Dienste in allen Namespaces gefunden',
      type: 'Typ',
      clusterIp: 'Cluster-IP',
      externalIp: 'Externe IPs',
      ports: 'Ports'
    }
  }
}

export function getTranslation(language: Language, path: string): string {
  const keys = path.split('.')
  let current: any = translations[language]
  
  for (const key of keys) {
    if (current && typeof current === 'object' && key in current) {
      current = current[key]
    } else {
      // Fallback to English if translation not found
      current = translations.english
      for (const fallbackKey of keys) {
        if (current && typeof current === 'object' && fallbackKey in current) {
          current = current[fallbackKey]
        } else {
          return path // Return the path if no translation found
        }
      }
      break
    }
  }
  
  return typeof current === 'string' ? current : path
}

export function useTranslation(language: Language) {
  return {
    t: (path: string) => getTranslation(language, path),
    language
  }
}
