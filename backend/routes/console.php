<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote')->hourly();

// Agendamento automático para sincronização e monitoramento de conexões
Schedule::command('connections:verify')->everyFifteenMinutes()->withoutOverlapping();
Schedule::command('connections:sync')->hourly()->withoutOverlapping();

