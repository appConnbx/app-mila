use tauri::{
    menu::{Menu, MenuItem},
    tray::TrayIconBuilder,
    Manager,
};

pub fn run() {
    tauri::Builder::default()
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
        .setup(|app| {
            // Sem acrílico nativo: ele pinta o retângulo inteiro da janela e
            // "vaza" nos cantos arredondados. O vidro vem do CSS translúcido
            // sobre a janela transparente — cantos limpos.
            let _window = app.get_webview_window("main").expect("janela main");

            // Bandeja: única forma de encerrar o widget (não há janela com X).
            let quit = MenuItem::with_id(app, "quit", "Sair do MILA", true, None::<&str>)?;
            let menu = Menu::with_items(app, &[&quit])?;
            TrayIconBuilder::new()
                .icon(app.default_window_icon().expect("ícone").clone())
                .tooltip("MILA — agente de demandas")
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
        .expect("erro ao iniciar o agente MILA");
}
