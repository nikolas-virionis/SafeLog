package com.mycompany.client.java.entity;

import java.util.List;
import com.mycompany.client.java.util.ConfigDB;
import org.springframework.jdbc.core.BeanPropertyRowMapper;
import org.springframework.jdbc.core.JdbcTemplate;

public class MachineData {

    private Integer idDadosMaquina;
    private String so;
    private String arquitetura;
    private String fabricante;
    private Integer fkMaquina;

    public MachineData(Integer idDadosMaquina, String so, String arquitetura, String fabricante, Integer fkMaquina) {
        this.idDadosMaquina = idDadosMaquina;
        this.so = so;
        this.arquitetura = arquitetura;
        this.fabricante = fabricante;
        this.fkMaquina = fkMaquina;
    }

    public MachineData() {
    }

    public Integer getFkMaquina() {
        return fkMaquina;
    }

    public void setFkMaquina(Integer fkMaquina) {
        this.fkMaquina = fkMaquina;
    }

    public String getFabricante() {
        return fabricante;
    }

    public void setFabricante(String fabricante) {
        this.fabricante = fabricante;
    }

    public String getArquitetura() {
        return arquitetura;
    }

    public void setArquitetura(String arquitetura) {
        this.arquitetura = arquitetura;
    }

    public String getSo() {
        return so;
    }

    public void setSo(String so) {
        this.so = so;
    }

    public Integer getIdDadosMaquina() {
        return idDadosMaquina;
    }

    public void setIdDadosMaquina(Integer idDadosMaquina) {
        this.idDadosMaquina = idDadosMaquina;
    }

    public static List<MachineData> selectAll() {
        // jdbcTemplate;
        try {
            JdbcTemplate jdbcTemplate = ConfigDB.getJdbcAWS();
            return jdbcTemplate.query("SELECT * FROM dados_maquina", new BeanPropertyRowMapper<>(MachineData.class));
        } catch (Exception e) {
            System.out.println("azure");
            JdbcTemplate jdbcTemplate = ConfigDB.getJdbcAzure();
            return jdbcTemplate.query("SELECT * FROM dados_maquina", new BeanPropertyRowMapper<>(MachineData.class));
        }

    }

}
