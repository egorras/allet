<template>
  <h1>Allet</h1>
  <p class="lead">Opera, ballet &amp; show tracker</p>

  <div class="row mt-4">
    <div class="col-md-3 mb-3">
      <div class="card">
        <div class="card-body">
          <h5 class="card-title">Productions</h5>
          <p class="card-text">Browse opera, ballet, and theatre productions by season.</p>
          <router-link to="/productions" class="btn btn-primary">Browse Productions</router-link>
        </div>
      </div>
    </div>
    <div class="col-md-3 mb-3">
      <div class="card">
        <div class="card-body">
          <h5 class="card-title">Shows</h5>
          <p class="card-text">Browse and track upcoming performances.</p>
          <router-link to="/shows" class="btn btn-primary">Browse Shows</router-link>
        </div>
      </div>
    </div>
    <div class="col-md-3 mb-3">
      <div class="card">
        <div class="card-body">
          <h5 class="card-title">Subscriptions</h5>
          <p class="card-text">Set up price and seat availability watches for your favourite shows.</p>
          <router-link to="/subscriptions" class="btn btn-primary">Manage Watches</router-link>
        </div>
      </div>
    </div>
    <div class="col-md-3 mb-3">
      <div class="card">
        <div class="card-body">
          <h5 class="card-title">Settings</h5>
          <p class="card-text">Configure Telegram notifications and other preferences.</p>
          <router-link to="/settings" class="btn btn-primary">Settings</router-link>
        </div>
      </div>
    </div>
  </div>
</template>
