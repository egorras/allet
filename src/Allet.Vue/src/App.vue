<template>
  <div class="app-layout">
    <nav class="sidebar">
      <div class="sidebar-brand">
        <router-link to="/" class="brand-link">Allet</router-link>
      </div>
      <ul class="sidebar-nav">
        <li>
          <router-link to="/" class="nav-link" exact-active-class="active">
            Home
          </router-link>
        </li>
        <li>
          <router-link to="/productions" class="nav-link" active-class="active">
            Productions
          </router-link>
        </li>
        <li>
          <router-link to="/shows" class="nav-link" active-class="active">
            Shows
          </router-link>
        </li>
        <li>
          <router-link to="/subscriptions" class="nav-link" active-class="active">
            Subscriptions
          </router-link>
        </li>
        <li>
          <router-link to="/settings" class="nav-link" active-class="active">
            Settings
          </router-link>
        </li>
        <li>
          <a href="/hangfire" target="_blank" class="nav-link">
            Hangfire
          </a>
        </li>
      </ul>
    </nav>
    <main class="main-content">
      <div class="content-container">
        <router-view />
      </div>
    </main>
  </div>
</template>

<style>
html, body {
  font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
  margin: 0;
  padding: 0;
  height: 100%;
}

#app {
  height: 100%;
}

.app-layout {
  display: flex;
  min-height: 100vh;
}

.sidebar {
  width: 250px;
  background: #1a1a2e;
  color: #fff;
  flex-shrink: 0;
}

.sidebar-brand {
  padding: 1rem 1.5rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.brand-link {
  color: #fff;
  text-decoration: none;
  font-size: 1.25rem;
  font-weight: 600;
}

.sidebar-nav {
  list-style: none;
  padding: 0.5rem 0;
  margin: 0;
}

.sidebar-nav .nav-link {
  display: block;
  padding: 0.6rem 1.5rem;
  color: rgba(255, 255, 255, 0.7);
  text-decoration: none;
  transition: background 0.15s, color 0.15s;
}

.sidebar-nav .nav-link:hover {
  color: #fff;
  background: rgba(255, 255, 255, 0.08);
}

.sidebar-nav .nav-link.active {
  color: #fff;
  background: rgba(255, 255, 255, 0.15);
}

.main-content {
  flex: 1;
  background: #f8f9fa;
  overflow-y: auto;
}

.content-container {
  padding: 1.5rem 2rem;
  max-width: 1400px;
}

a, .btn-link {
  color: #006bb7;
}

.btn-primary {
  color: #fff;
  background-color: #1b6ec2;
  border-color: #1861ac;
}

@media (max-width: 768px) {
  .app-layout {
    flex-direction: column;
  }
  .sidebar {
    width: 100%;
  }
  .sidebar-nav {
    display: flex;
    overflow-x: auto;
  }
  .sidebar-nav .nav-link {
    white-space: nowrap;
  }
}
</style>
