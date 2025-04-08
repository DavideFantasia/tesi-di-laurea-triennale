#include "LogSys.h"

std::vector<log_data_t> Log_System::log_data;
double Log_System::last_data = -1.0; // valore iniziale

void Log_System::add_data(double data) {
    if (GUIManager::log_enabled() && last_data != data) {
        log_data.push_back({ data, ImGui::GetIO().Framerate });
        last_data = data;
    }
}

void Log_System::print_log() {
    //stampa dei dati di LOG su file csv
    std::ofstream logfile("../log.csv");
    logfile << "Data,FPS\n";
    for (const auto& entry : log_data) {
        logfile << entry.data << "," << entry.fps << "\n";
    }
    logfile.close();
}

