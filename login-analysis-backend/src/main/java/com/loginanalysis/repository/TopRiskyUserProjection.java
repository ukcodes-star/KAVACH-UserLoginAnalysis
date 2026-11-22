package com.loginanalysis.repository;

public interface TopRiskyUserProjection {

    Long getUserId();

    String getUsername();

    Long getRiskScore();

    Long getAnomalyCount();
}