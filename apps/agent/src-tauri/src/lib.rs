use tauri::{
    menu::{Menu, MenuItem},
    tray::TrayIconBuilder,
    Manager,
};

pub fn run() {
    let mut builder = tauri::Builder::default()
        // Uma instância só: abrir de novo apenas foca o widget existente.
        .plugin(tauri_plugin_single_instance::init(|app, _args, _cwd| {
            if let Some(w) = app.get_webview_window("main") {
                let _ = w.show();
                let _ = w.set_focus();
            }
        }))
        .plugin(tauri_plugin_autostart::init(
            tauri_plugin_autostart::MacosLauncher::LaunchAgent,
            None,
        ))
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_opener::init());

    // Auto-update só FORA da Store (feature `store` desliga). Na Microsoft Store
    // as atualizações vêm pela loja; o updater interno faria a certificação
    // reprovar o pacote. No build de Store o checkUpdate() do front cai no
    // try/catch e vira no-op.
    #[cfg(not(feature = "store"))]
    {
        builder = builder.plugin(tauri_plugin_updater::Builder::new().build());
    }

    builder
        .setup(|app| {
            // Sem acrílico nativo: ele pinta o retângulo inteiro da janela e
            // "vaza" nos cantos arredondados. O vidro vem do CSS translúcido
            // sobre a janela transparente — cantos limpos.
            let _window = app.get_webview_window("main").expect("janela main");

            // Bandeja: encerra o widget (também há o botão ✕ no cabeçalho da janela).
            let quit = MenuItem::with_id(app, "quit", "Sair do appMila", true, None::<&str>)?;
            let menu = Menu::with_items(app, &[&quit])?;
            TrayIconBuilder::new()
                .icon(app.default_window_icon().expect("ícone").clone())
                .tooltip("appMila — agente de demandas")
                .menu(&menu)
                .on_menu_event(|app, event| {
                    if event.id().as_ref() == "quit" {
                        app.exit(0);
                    }
                })
                .build(app)?;

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("erro ao iniciar o agente appMila");
}
